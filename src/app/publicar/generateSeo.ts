type GenerateSeoInput = {
	title: string;
	description: string;
	mediaUrl?: string;
};

type GenerateSeoOutput = {
	es: {
		title: string;
		metas: {
			content: string;
			name: string;
		}[];
	};
};

export function generateSeo({
	title,
	description,
	mediaUrl = '',
}: GenerateSeoInput): GenerateSeoOutput {
	const localDescription = description.trim();
	const shortDescription = localDescription.length > 160 ? localDescription.slice(0, 160).trim() : localDescription;

	const titleKeywords = title.toLowerCase().split(' ').filter(Boolean);
	const descriptionKeywords = shortDescription.toLowerCase().split(' ').filter(Boolean);

	const allKeywords = new Set([...titleKeywords, ...descriptionKeywords]);
	const keywords = Array.from(allKeywords).join(', ');

	return {
		es: {
			title: `${title} | Post saludable`,
			metas: [
				{
					content: keywords,
					name: "keywords",
				},
				{
					content: mediaUrl,
					name: "image",
				},
				{
					content: shortDescription,
					name: "description",
				},
			]
		},
	};
}