import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dompetin.app";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/", "/login", "/privacy", "/terms"],
                disallow: [
                    "/dashboard",
                    "/accounts",
                    "/categories",
                    "/goals",
                    "/reports",
                    "/settings",
                    "/transactions",
                    "/reset-password",
                    "/auth/",
                    "/api/",
                ],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
