type GenerateSeoInput = {
	title: string;
	description: string;
	mediaUrl?: string;
	url?: string; // Nueva propiedad para og:url
};

type GenerateSeoOutput = {
	es: {
		title: string;
		metas: {
			content: string;
			name?: string;
			property?: string;
		}[];
	};
};

export function generateSeo({
	title,
	description,
	mediaUrl = '',
	url = ''
}: GenerateSeoInput): GenerateSeoOutput {
	const localDescription = description.trim();
	const shortDescription = localDescription.length > 160 ? localDescription.slice(0, 160).trim() : localDescription;

	const titleKeywords = title.toLowerCase().split(' ').filter(Boolean);
	const descriptionKeywords = shortDescription.toLowerCase().split(' ').filter(Boolean);

	const allKeywords = new Set([...titleKeywords, ...descriptionKeywords]);
	const keywords = Array.from(allKeywords).join(', ');

	// Crear descripción más corta para redes sociales
	const socialDescription = localDescription.length > 100 
		? localDescription.slice(0, 100).trim() + '...' 
		: localDescription;

	return {
		es: {
			title: `${title} | Post saludable`,
			metas: [
				// Meta tags básicas
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
				
				// Open Graph meta tags
				{
					content: title,
					property: "og:title",
				},
				{
					content: socialDescription,
					property: "og:description",
				},
				{
					content: mediaUrl,
					property: "og:image",
				},
				{
					content: url,
					property: "og:url",
				},
				{
					content: "website",
					property: "og:type",
				},
				
				// Twitter Card meta tags
				{
					content: "summary_large_image",
					name: "twitter:card",
				},
				{
					content: title,
					name: "twitter:title",
				},
				{
					content: socialDescription,
					name: "twitter:description",
				},
				{
					content: mediaUrl,
					name: "twitter:image",
				},
				{
					content: "https://saludjusta.site",
					name: "twitter:domain",
				},
			]
		},
	};
}