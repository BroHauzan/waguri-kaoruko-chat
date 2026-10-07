import { Character, Chat, Message, ScheduledTask } from "../types";
import { storage } from "./storage";
import { sendMessageToGemini } from "./geminiClient";
import { sendPushLikeNotification } from "./pushNotification";

let isRunningCheck = false;

export async function checkAndExecuteScheduledRoutines(
  onUpdateChat?: (chat: Chat) => void
): Promise<void> {
  if (isRunningCheck) return;
  isRunningCheck = true;

  try {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${hours}:${minutes}`;
    const todayDateStr = now.toISOString().split("T")[0];

    const allTasks: ScheduledTask[] = storage.getScheduledTasks();
    const dueTasks = allTasks.filter(
      (t) => t.enabled && t.time === currentTime && t.lastExecutedDate !== todayDateStr
    );

    for (const task of dueTasks) {
      // Tandai langsung di storage agar tidak dieksekusi berulang dalam menit yang sama
      storage.updateScheduledTaskLastExecuted(task.id, todayDateStr, !task.repeatDaily);

      const character: Character | undefined = storage.getCharacterById(task.characterId);
      if (!character) continue;

      const chat: Chat = storage.getChatByCharacterId(task.characterId, character);
      const settings = storage.getSettings();

      const promptInstruction = `[JADWAL OTOMATIS: "${task.title}". Lakukan instruksi berikut secara proaktif dan alami tanpa menyebut bahwa ini adalah bot/jadwal terjadwal: ${task.instruction}]`;

      try {
        const response = await sendMessageToGemini({
          character,
          chat,
          userMessage: promptInstruction,
          settings,
        });

        const incomingList =
          response.messages && response.messages.length > 0
            ? response.messages
            : ["Hai!"];

        const newCharMessages: Message[] = incomingList.map((text, idx) => ({
          id: `msg_char_routine_${Date.now()}_${idx}`,
          role: "char",
          text,
          emotion: response.emotion || character.defaultMood,
          intensity: response.intensity || 6,
          timestamp: Date.now() + idx * 10,
        }));

        const updatedChat: Chat = {
          ...chat,
          messages: [...chat.messages, ...newCharMessages],
          currentMood: {
            emotion: response.emotion || character.defaultMood,
            intensity: response.intensity || 6,
          },
          updatedAt: Date.now(),
        };

        storage.saveChat(updatedChat);
        onUpdateChat?.(updatedChat);

        const lastSummary =
          newCharMessages[newCharMessages.length - 1]?.text || "Pesan terjadwal";

        sendPushLikeNotification(character.name, {
          body: lastSummary,
          icon: character.avatarUrl,
          characterId: character.id,
        }).catch(() => {});
      } catch (err) {
        console.error("Gagal menjalankan instruksi terjadwal untuk task", task.id, err);
      }
    }
  } finally {
    isRunningCheck = false;
  }
}
