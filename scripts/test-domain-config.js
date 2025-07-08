#!/usr/bin/env node

/**
 * Quick test script to validate Vercel API configuration
 * Run with: node scripts/test-domain-config.js
 */

const https = require("node:https");

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

console.log("🔍 Testing Vercel API Configuration...\n");

// Check environment variables
console.log("Environment Variables:");
console.log(
	`✓ VERCEL_API_TOKEN: ${VERCEL_API_TOKEN ? "✅ Set" : "❌ Missing"} ${VERCEL_API_TOKEN ? `(${VERCEL_API_TOKEN.length} chars)` : ""}`,
);
console.log(
	`✓ VERCEL_PROJECT_ID: ${VERCEL_PROJECT_ID ? "✅ Set" : "❌ Missing"} ${VERCEL_PROJECT_ID ? `(${VERCEL_PROJECT_ID})` : ""}`,
);
console.log(
	`✓ VERCEL_TEAM_ID: ${VERCEL_TEAM_ID ? "✅ Set" : "⚠️  Optional"} ${VERCEL_TEAM_ID ? `(${VERCEL_TEAM_ID})` : ""}`,
);
console.log();

if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
	console.log("❌ Missing required environment variables!");
	console.log("Please set VERCEL_API_TOKEN and VERCEL_PROJECT_ID");
	process.exit(1);
}

// Test Vercel API connection
function testVercelAPI() {
	return new Promise((resolve, reject) => {
		const path = `/v10/projects/${VERCEL_PROJECT_ID}/domains${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ""}`;

		const options = {
			hostname: "api.vercel.com",
			path: path,
			method: "GET",
			headers: {
				Authorization: `Bearer ${VERCEL_API_TOKEN}`,
				"Content-Type": "application/json",
			},
		};

		const req = https.request(options, (res) => {
			let data = "";
			res.on("data", (chunk) => {
				data += chunk;
			});
			res.on("end", () => {
				try {
					const parsed = JSON.parse(data);
					resolve({ status: res.statusCode, data: parsed });
				} catch (_e) {
					resolve({ status: res.statusCode, data: data });
				}
			});
		});

		req.on("error", (error) => {
			reject(error);
		});

		req.end();
	});
}

async function runTests() {
	console.log("🚀 Testing Vercel API connection...");

	try {
		const result = await testVercelAPI();

		if (result.status === 200) {
			console.log("✅ Vercel API connection successful!");
			console.log(
				`Found ${result.data.domains ? result.data.domains.length : 0} existing domains`,
			);

			if (result.data.domains && result.data.domains.length > 0) {
				console.log("\nExisting domains:");
				result.data.domains.forEach((domain) => {
					console.log(
						`  - ${domain.name} (${domain.verified ? "verified" : "pending"})`,
					);
				});
			}
		} else if (result.status === 401) {
			console.log("❌ Authentication failed!");
			console.log("Please check your VERCEL_API_TOKEN");
		} else if (result.status === 403) {
			console.log("❌ Access denied!");
			console.log("Please check your token permissions and project access");
		} else if (result.status === 404) {
			console.log("❌ Project not found!");
			console.log("Please check your VERCEL_PROJECT_ID");
		} else {
			console.log(`❌ API request failed with status ${result.status}`);
			console.log("Response:", result.data);
		}
	} catch (error) {
		console.log("❌ Network error:", error.message);
	}

	console.log();
	console.log("📋 Next Steps:");
	if (VERCEL_API_TOKEN && VERCEL_PROJECT_ID) {
		console.log("1. If tests passed: Custom domain functionality should work");
		console.log("2. If tests failed: Fix the environment variables");
		console.log("3. Test adding a domain through the UI");
		console.log("4. Check /api/pro/domain/config-check endpoint");
	} else {
		console.log("1. Set required environment variables");
		console.log("2. Restart your application");
		console.log("3. Run this test script again");
	}
}

runTests().catch(console.error);
