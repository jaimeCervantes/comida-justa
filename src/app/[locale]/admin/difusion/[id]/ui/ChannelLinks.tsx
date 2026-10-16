import ChannelDetails, { type ChannelLinkItem } from "./ChannelDetails";

/**
 * Los grupos de compraventa, para abrirlos: ahí se marca por pan, así que la lista de grupos va una
 * sola vez arriba de los artículos y cada artículo lleva solo sus casillas.
 */
export default function ChannelLinks({
  items,
}: {
  items: readonly ChannelLinkItem[];
}) {
  return (
    <ul
      data-testid="outreach-channel-links"
      className="mb-4 flex flex-col gap-2"
    >
      {items.map((item) => (
        <li
          key={item.channel.id}
          data-testid="outreach-channel-link"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-card border border-separator p-3"
        >
          <span className="font-semibold">{item.channel.name}</span>
          <ChannelDetails {...item} />
        </li>
      ))}
    </ul>
  );
}
