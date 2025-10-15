import { type SiteDataProps } from "../types/configDataTypes";

// Update this file with your site specific information
const siteData: SiteDataProps = {
	name: "Vehivio",
	// Your website's title and description (meta fields)
	title: "Vehivio - Automotive & Mobility",
	description:
		"Your go-to resource for all things Automotive & Mobility, providing insights, reviews, and news.",
	// Your information!
	author: {
		name: "Vehivio Team",
		email: "hello@Vehivio.com",
		twitter: "vehivio",
	},

	// default image for meta tags if the page doesn't have an image already
	defaultImage: {
		src: "/images/og/vehivio-1200x630.jpg",
		alt: "Vehivio logo",
	},
};

export default siteData;