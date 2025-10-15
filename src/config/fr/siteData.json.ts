import { type SiteDataProps } from "../types/configDataTypes";

// Update this file with your site specific information
const siteData: SiteDataProps = {
	name: "TravelWorld",
	// Your website's title and description (meta fields)
	title: "TravelWorld - Travel & Adventure",
	description:
		"Explore breathtaking destinations and unforgettable experiences in travel and adventure.",
	// Your information!
	author: {
		name: "TravelWorld Team",
		email: "hello@TravelWorld.com",
		twitter: "travelworld",
	},

	// default image for meta tags if the page doesn't have an image already
	defaultImage: {
		src: "/images/og/travelworld-1200x630.jpg",
		alt: "TravelWorld logo",
	},
};

export default siteData;