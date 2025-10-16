/**
 * * Configuration of the i18n system data files and text translations
 * Example translations below are for English and French, with textTranslations used in src/layouts/BlogLayoutCenter.astro and src/components/Hero/[hero].astro
 */

/**
 * * Data file configuration for the i18n system
 * Every {Data} key must exist in the below object
 */
import navDataEn from "./en/navData.json";
import siteDataEn from "./en/siteData.json";
import navDataFr from "./fr/navData.json";
import siteDataFr from "./fr/siteData.json";

export const dataTranslations = {
	en: {
		siteData: siteDataEn,
		navData: navDataEn,
	},
	fr: {
		siteData: siteDataFr,
		navData: navDataFr,
	},
} as const;

/**
 * * Route translations for the i18n system
 * Maps routes between different locales
 */
export const routeTranslations = {
	en: {
		home: "",
		blog: "blog",
		categories: "categories",
		tags: "tags",
		about: "about",
		contact: "contact",
		privacy: "privacy",
		terms: "terms",
		"cookie-policy": "cookie-policy",
		overview: "overview",
	},
	fr: {
		home: "",
		blog: "blog",
		categories: "categories",
		tags: "tags",
		about: "a-propos",
		contact: "contact",
		privacy: "confidentialite",
		terms: "conditions",
		"cookie-policy": "politique-cookies",
		overview: "apercu",
	},
} as const;

/**
 * * Collection name translations for localized content collections
 */
export const localizedCollections = {
	blog: {
		en: "blog",
		fr: "blog",
	},
	categories: {
		en: "categories",
		fr: "categories",
	},
	tags: {
		en: "tags",
		fr: "tags",
	},
} as const;

/**
 * * Text translations are used with the `useTranslation` function from src/js/i18nUtils.ts to translate various strings on your site.
 *
 * ## Example
 *
 * ```ts
 * import { getLocaleFromUrl } from "@js/localeUtils";
 * import { useTranslations } from "@js/translationUtils";
 * const currLocale = getLocaleFromUrl(Astro.url);
 * const t = useTranslations(currLocale);
 * t("back_to_all_posts"); // this would be "Retour � tous les articles" if the current locale is "fr"
 * ```
 * or
 * ```ts
 * import { useTranslations } from "@js/translationUtils";
 * const t = useTranslations("fr");
 * t("back_to_all_posts"); // this would be "Retour � tous les articles"
 * ```
 */
export const textTranslations = {
	en: {
		"hero_description": "Explore the latest in Automotive & Mobility.",
		"back_to_all_posts": "Back to all articles",
		"updated_on": "Updated on",
		"read_more": "Read more",
		"categories": "Categories",
		"table_of_contents": "Table of Contents",
		"share_this_post": "Share this article",
		"search_placeholder": "Search articles...",
		"no_posts_found": "No articles found",
		"showing_results_for": "Showing results for",
		"newsletter_title": "AutoMobility Newsletter",
		"newsletter_description": "Get updates delivered to your inbox",
		"newsletter_placeholder": "Enter your email",
		"newsletter_button": "Subscribe",
		"footer_rights": "All rights reserved"
	},
	fr: {
		"hero_description": "Votre source de confiance pour la santé, le fitness, la nutrition et la vie consciente.",
		"back_to_all_posts": "Retour à tous les articles",
		"updated_on": "Mis à jour le",
		"read_more": "Lire la suite",
		"categories": "Catégories",
		"table_of_contents": "Table des matières",
		"share_this_post": "Partager cet article",
		"search_placeholder": "Rechercher des articles...",
		"no_posts_found": "Aucun article trouvé",
		"showing_results_for": "Résultats pour",
		"newsletter_title": "Restez informé",
		"newsletter_description": "Recevez les derniers conseils bien-être dans votre boîte mail.",
		"newsletter_placeholder": "Entrez votre email",
		"newsletter_button": "S'abonner",
		"footer_rights": "Tous droits réservés"
	},
};