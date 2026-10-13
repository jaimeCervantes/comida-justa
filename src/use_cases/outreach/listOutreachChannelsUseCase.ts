import type IOutreachChannelRepository from "./ports/IOutreachChannelRepository";
import type { OutreachChannel } from "./ports/IOutreachChannelRepository";

/** La lista de `/admin/difusion/grupos`, por nombre. */
export default class ListOutreachChannelsUseCase {
  constructor(private readonly channels: IOutreachChannelRepository) {}

  async execute(): Promise<OutreachChannel[]> {
    return this.channels.list();
  }
}
