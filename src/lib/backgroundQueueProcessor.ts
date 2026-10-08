import { Character, Chat, Message, Settings } from "../types";
import {
  enqueueTask,
  getPendingTasks,
  removeTask,
  updateTask,
  PendingTask,
} from "./indexedDbQueue";
import { sendMessageToGemini } from "./geminiClient";
import { storage } from "./storage";
import { sendPushLikeNotification } from "./pushNotification";

type QueueSubscriber = (data: {
  characterId: string;
  chat: Chat;
  character: Character;
  lastReplyText: string;
}) => void;

class BackgroundQueueProcessor {
  private isProcessing = false;
  private subscribers: Set<QueueSubscriber> = new Set();

  /**
   * Task IDs the foreground (ChatScreen) is handling right now with its own
   * request. The queue must NOT process these: doing so fires a second Gemini
   * call for the same turn and delivers a duplicate reply. This happens in
   * practice whenever `visibilitychange` / `online` fires mid-request — i.e.
   * the user switches app while waiting for a reply.
   */
  private foregroundTasks: Set<string> = new Set();

  public markForeground(taskId: string): void {
    this.foregroundTasks.add(taskId);
  }

  public releaseForeground(taskId: string): void {
    this.foregroundTasks.delete(taskId);
  }

  public subscribe(cb: QueueSubscriber): () => void {
    this.subscribers.add(cb);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  private notifySubscribers(data: {
    characterId: string;
    chat: Chat;
    character: Character;
    lastReplyText: string;
  }) {
    for (const sub of this.subscribers) {
      try {
        sub(data);
      } catch (e) {
        console.error("Queue subscriber error", e);
      }
    }
  }

  /**
   * Enqueue a new user turn into IndexedDB and begin background processing
   */
  public async enqueue(params: {
    character: Character;
    chatWithUserMessage: Chat;
    userMessageText: string;
    settings: Settings;
  }): Promise<string> {
    const taskId = `task_${params.character.id}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    const task: PendingTask = {
      id: taskId,
      characterId: params.character.id,
      characterName: params.character.name,
      characterAvatar: params.character.avatarUrl,
      userMessage: params.userMessageText,
      chatSnapshot: params.chatWithUserMessage,
      character: params.character,
      createdAt: Date.now(),
      status: "pending",
    };

    try {
      await enqueueTask(task);
    } catch (e) {
      console.warn("Could not write task to IndexedDB:", e);
    }

    // Trigger queue processor
    this.processQueue(params.settings);

    return taskId;
  }

  /**
   * Resume and process any pending tasks saved in IndexedDB
   * Useful when app starts, window becomes visible, or after reload
   */
  public async resumePendingTasks(settings: Settings): Promise<void> {
    if (this.isProcessing) return;
    try {
      const pending = await getPendingTasks();
      if (pending.length > 0) {
        this.processQueue(settings);
      }
    } catch (e) {
      console.warn("Error resuming pending tasks from IndexedDB:", e);
    }
  }

  /**
   * Loop through pending tasks in IndexedDB and generate AI responses
   */
  private async processQueue(settings: Settings): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      let pendingList = await getPendingTasks();

      while (pendingList.length > 0) {
        // Skip anything the foreground request is already handling.
        const currentTask = pendingList.find(
          (t) => !this.foregroundTasks.has(t.id)
        );
        if (!currentTask) break;

        currentTask.status = "processing";
        await updateTask(currentTask).catch(() => {});

        try {
          // Call Gemini API through backend
          const response = await sendMessageToGemini({
            character: currentTask.character,
            chat: currentTask.chatSnapshot,
            userMessage: currentTask.userMessage,
            settings,
            image: currentTask.image || null,
            audio: currentTask.audio || null,
          });

          const incomingList =
            response.messages && response.messages.length > 0
              ? response.messages
              : ["..."];

          const charMessages: Message[] = incomingList.map((text, idx) => ({
            id: `msg_char_${Date.now()}_${idx}`,
            role: "char",
            text,
            emotion: response.emotion || currentTask.character.defaultMood,
            intensity: response.intensity || 6,
            timestamp: Date.now() + idx * 10,
          }));

          // Fetch current stored chat state to avoid overwriting newer messages
          const latestChat = storage.getChatByCharacterId(
            currentTask.characterId,
            currentTask.character
          );

          // Append to latest chat if not already present
          const existingIds = new Set(latestChat.messages.map((m) => m.id));
          const newUniqueMessages = charMessages.filter(
            (m) => !existingIds.has(m.id)
          );

          const updatedChat: Chat = {
            ...latestChat,
            messages: [...latestChat.messages, ...newUniqueMessages],
            currentMood: {
              emotion: response.emotion || currentTask.character.defaultMood,
              intensity: response.intensity || 6,
            },
            updatedAt: Date.now(),
          };

          // Save to permanent storage
          storage.saveChat(updatedChat);

          // Update preferensi karakter jika ada instruksi panggilan / gaya baru
          if (response.updatedInstruction || response.updatedSpeakingStyle || response.preferredUserName) {
            const allChars = storage.getCharacters();
            const targetChar = allChars.find((c) => c.id === currentTask.characterId);
            if (targetChar) {
              let instructions = targetChar.customInstructions || "";
              if (
                response.updatedInstruction &&
                !instructions.toLowerCase().includes(response.updatedInstruction.toLowerCase())
              ) {
                instructions = instructions.trim()
                  ? `${instructions.trim()}\n- ${response.updatedInstruction}`
                  : `- ${response.updatedInstruction}`;
              }

              let newSpeakingStyle = targetChar.speakingStyle || "";
              if (response.updatedSpeakingStyle && response.updatedSpeakingStyle.trim()) {
                newSpeakingStyle = response.updatedSpeakingStyle.trim();
              } else if (response.preferredUserName) {
                const callRule = `Selalu panggil pengguna dengan sebutan "${response.preferredUserName}".`;
                const cleaned = newSpeakingStyle.replace(/(?:Selalu )?panggil pengguna dengan sebutan "[^"]*"\.?\s*/gi, "").trim();
                newSpeakingStyle = `${callRule} ${cleaned}`.trim();
              }

              storage.saveCharacter({
                ...targetChar,
                speakingStyle: newSpeakingStyle,
                customInstructions: instructions,
              });
            }
            if (response.preferredUserName) {
              const currentSettings = storage.getSettings();
              if (currentSettings.userName !== response.preferredUserName) {
                storage.saveSettings({
                  ...currentSettings,
                  userName: response.preferredUserName,
                });
              }
            }
          }

          const lastReplyText =
            charMessages[charMessages.length - 1]?.text || "Membalas pesanmu";

          // Deliver native push-like notification
          await sendPushLikeNotification(currentTask.characterName, {
            body: lastReplyText,
            icon: currentTask.characterAvatar,
            characterId: currentTask.characterId,
            tag: `chat-${currentTask.characterId}`,
          });

          // Notify any active React listeners in the UI
          this.notifySubscribers({
            characterId: currentTask.characterId,
            chat: updatedChat,
            character: currentTask.character,
            lastReplyText,
          });

          // Task is complete! Remove from IndexedDB queue
          await removeTask(currentTask.id).catch(() => {});
        } catch (err: any) {
          console.error("Background task execution error:", err);
          currentTask.status = "failed";
          currentTask.error = String(err?.message || err);
          await updateTask(currentTask).catch(() => {});
          // Remove failed task after recording or retry once
          await removeTask(currentTask.id).catch(() => {});
        }

        // Fetch remaining
        pendingList = await getPendingTasks();
      }
    } catch (e) {
      console.warn("Queue processing error:", e);
    } finally {
      this.isProcessing = false;
    }
  }
}

export const backgroundQueue = new BackgroundQueueProcessor();
