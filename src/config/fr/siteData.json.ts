import { type SiteDataProps } from "../types/configDataTypes";

// Update this file with your site specific information
const siteData: SiteDataProps = {
	name: "AutoMobility",
	// Your website's title and description (meta fields)
	title: "AutoMobility - Automotive & Mobility",
	description:
		"Your destination for the latest in automotive and mobility solutions.",
	// Your information!
	author: {
		name: "AutoMobility Team",
		email: "hello@AutoMobility.com",
		twitter: "automobility",
	},

	// default image for meta tags if the page doesn't have an image already
	defaultImage: {
		src: "/images/og/automobility-1200x630.jpg",
		alt: "AutoMobility logo",
	},
};

export default siteData;