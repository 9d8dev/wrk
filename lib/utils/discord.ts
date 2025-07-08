interface DiscordEmbed {
	title?: string;
	description?: string;
	color?: number;
	fields?: Array<{
		name: string;
		value: string;
		inline?: boolean;
	}>;
	thumbnail?: {
		url: string;
	};
	footer?: {
		text: string;
	};
	timestamp?: string;
}

interface DiscordWebhookPayload {
	content?: string;
	username?: string;
	avatar_url?: string;
	embeds?: DiscordEmbed[];
}

export async function sendDiscordNotification(payload: DiscordWebhookPayload) {
	const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

	if (!webhookUrl) {
		console.log("Discord webhook URL not configured");
		return;
	}

	try {
		const response = await fetch(webhookUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			console.error(
				"Failed to send Discord notification:",
				response.statusText,
			);
		}
	} catch (error) {
		console.error("Error sending Discord notification:", error);
	}
}

export async function notifyNewUserSignup(user: {
	name: string;
	email: string;
	username: string;
	createdAt?: Date;
}) {
	const embed: DiscordEmbed = {
		title: "🎉 New User Signup!",
		description: `A new user has joined Wrk.so`,
		color: 0x00ff00, // Green color
		fields: [
			{
				name: "Name",
				value: user.name || "Not provided",
				inline: true,
			},
			{
				name: "Username",
				value: `@${user.username}`,
				inline: true,
			},
			{
				name: "Email",
				value: user.email || "Not provided",
				inline: false,
			},
			{
				name: "Portfolio URL",
				value: `${process.env.NEXT_PUBLIC_APP_URL || "https://wrk.so"}/${
					user.username
				}`,
				inline: false,
			},
		],
		footer: {
			text: "Wrk.so",
		},
		timestamp: new Date().toISOString(),
	};

	await sendDiscordNotification({
		username: "Wrk.so Bot",
		embeds: [embed],
	});
}
