import { Metadata } from 'next';

type GenerateSeoInput = {
	title: string;
	description: string;
	mediaUrl?: string;
	url?: string;
};

export function generateSeo({
	title,
	description,
	mediaUrl = '',
	url = ''
}: GenerateSeoInput): Metadata {
	const trimedDescription = description.trim();
	const shortDescription = trimedDescription.length > 160 ? trimedDescription.slice(0, 160).trim() : trimedDescription;

	const titleKeywords = title.toLowerCase().split(' ').filter(Boolean);
	const descriptionKeywords = shortDescription.toLowerCase().split(' ').filter(Boolean);

	const allKeywords = new Set([...titleKeywords, ...descriptionKeywords]);
	const keywords = Array.from(allKeywords).join(', ');

	// Crear descripción más corta para redes sociales
	const socialDescription = trimedDescription.length > 100
		? trimedDescription.slice(0, 100).trim() + '...'
		: trimedDescription;

	return {
		// Meta básicos
		title: `${title} | Salud Justa`,
		description: shortDescription,
		keywords: keywords,
		
		// Configuración básica
		applicationName: 'Salud Justa',
		authors: [{ name: 'Salud Justa' }],
		generator: 'Next.js',
		
		// Open Graph - Facebook, LinkedIn, etc.
		openGraph: {
			title: title,
			description: socialDescription,
			url: url,
			siteName: 'Salud Justa',
			images: mediaUrl ? [
				{
					url: mediaUrl,
					width: 1200,
					height: 630,
					alt: title,
				}
			] : [],
			locale: 'es_ES',
			type: 'website',
		},
		
		// Twitter Cards
		twitter: {
			card: 'summary_large_image',
			title: title,
			description: socialDescription,
			images: mediaUrl ? [mediaUrl] : [],
			site: '@saludjusta', // Cambia por tu handle real
			creator: '@saludjusta', // Cambia por tu handle real
		},
		
		// Robots y SEO
		robots: {
			index: true,
			follow: true,
			nocache: false,
			googleBot: {
				index: true,
				follow: true,
				noimageindex: false,
				'max-video-preview': -1,
				'max-image-preview': 'large',
				'max-snippet': -1,
			},
		},
		
		// URLs alternativas y canónicas
		alternates: {
			canonical: url,
			languages: {
				'es-ES': url,
			},
		},
		
		// Configuración del viewport (importante para móvil)
		viewport: {
			width: 'device-width',
			initialScale: 1,
		},
		
		// Información adicional
		category: 'health',
		
		// Meta tags adicionales que no están en los tipos estándar
		other: {
			// Twitter específicos
			'twitter:domain': 'saludjusta.site',
			
			// Para mejor SEO
			'theme-color': '#ffffff',
			'msapplication-TileColor': '#ffffff',
			
			// Para PWA si lo implementan después
			'mobile-web-app-capable': 'yes',
			'apple-mobile-web-app-capable': 'yes',
			'apple-mobile-web-app-status-bar-style': 'default',
		}
	};
}

// Ejemplo de uso en src/app/[locale]/page.tsx
export async function generateMetadata({ 
	params 
}: { 
	params: { locale: string } 
}): Promise<Metadata> {
	// Aquí puedes obtener datos dinámicos si necesitas
	// const pageData = await getPageData(params.locale);
	
	return generateSeo({
		title: "Bienvenido a Salud Justa",
		description: "Descubre recetas saludables, consejos nutricionales y todo lo que necesitas para una alimentación balanceada y deliciosa.",
		mediaUrl: "https://saludjusta.site/og-image.jpg", // Asegúrate de tener esta imagen
		url: `https://saludjusta.site/${params.locale}`,
	});
}