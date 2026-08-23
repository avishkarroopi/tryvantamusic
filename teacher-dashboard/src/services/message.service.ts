import type { ChatMessage, MessageChannel } from "@/domain/types";
import { chatMessages as mockMessages, messageChannels as mockChannels } from "@/mocks/seed";
import { makeId } from "@/lib/id";
import { nowISO } from "@/lib/date";
import { clone, withDelay } from "./async";

export interface MessageService {
  listChannels(): Promise<MessageChannel[]>;
  listMessages(channelId: string): Promise<ChatMessage[]>;
  sendMessage(channelId: string, text: string): Promise<ChatMessage>;
  markChannelRead(channelId: string): Promise<void>;
}

const channelStore: MessageChannel[] = clone(mockChannels);
let messageStore: ChatMessage[] = clone(mockMessages);

export const messageService: MessageService = {
  async listChannels() {
    return withDelay(clone(channelStore));
  },
  async listMessages(channelId) {
    return withDelay(clone(messageStore.filter((m) => m.channelId === channelId)));
  },
  async sendMessage(channelId, text) {
    const message: ChatMessage = {
      id: makeId("msg"),
      channelId,
      sender: "teacher",
      senderName: "You",
      text,
      sentAt: nowISO(),
    };
    messageStore = [...messageStore, message];
    const channel = channelStore.find((c) => c.id === channelId);
    if (channel) {
      channel.lastMessage = text;
      channel.lastMessageAt = message.sentAt;
    }
    return withDelay(clone(message), 220);
  },
  async markChannelRead(channelId) {
    const channel = channelStore.find((c) => c.id === channelId);
    if (channel) channel.unreadCount = 0;
    await withDelay(null, 120);
  },
};
