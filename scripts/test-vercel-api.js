#!/usr/bin/env node

// Test script to verify Vercel API access
require('dotenv').config({ path: '.env.local' });

const projectId = process.env.VERCEL_PROJECT_ID;
const teamId = process.env.VERCEL_TEAM_ID;
const apiToken = process.env.VERCEL_API_TOKEN;

if (!apiToken || !projectId) {
  console.error('❌ Missing required environment variables');
  console.error('VERCEL_API_TOKEN:', apiToken ? 'Set' : 'Not set');
  console.error('VERCEL_PROJECT_ID:', projectId ? 'Set' : 'Not set');
  console.error('VERCEL_TEAM_ID:', teamId ? 'Set' : 'Not set');
  process.exit(1);
}

async function testVercelAPI() {
  console.log('🔍 Testing Vercel API access...\n');

  // Test 1: Get project info
  console.log('1️⃣ Testing project access...');
  try {
    const projectUrl = `https://api.vercel.com/v9/projects/${projectId}${teamId ? `?teamId=${teamId}` : ''}`;
    const projectResponse = await fetch(projectUrl, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (projectResponse.ok) {
      const project = await projectResponse.json();
      console.log('✅ Project access successful!');
      console.log(`   Project name: ${project.name}`);
      console.log(`   Framework: ${project.framework || 'Not set'}`);
    } else {
      const error = await projectResponse.json();
      console.error('❌ Project access failed:', projectResponse.status);
      console.error('   Error:', error.error?.message || error);
    }
  } catch (error) {
    console.error('❌ Project API call failed:', error.message);
  }

  console.log('\n2️⃣ Testing domain management permissions...');
  try {
    // List existing domains
    const domainsUrl = `https://api.vercel.com/v9/projects/${projectId}/domains${teamId ? `?teamId=${teamId}` : ''}`;
    const domainsResponse = await fetch(domainsUrl, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (domainsResponse.ok) {
      const data = await domainsResponse.json();
      console.log('✅ Domain listing successful!');
      console.log(`   Current domains: ${data.domains?.length || 0}`);
      if (data.domains?.length > 0) {
        data.domains.forEach(domain => {
          console.log(`   - ${domain.name}`);
        });
      }
    } else {
      const error = await domainsResponse.json();
      console.error('❌ Domain listing failed:', domainsResponse.status);
      console.error('   Error:', error.error?.message || error);
    }
  } catch (error) {
    console.error('❌ Domain API call failed:', error.message);
  }

  console.log('\n3️⃣ Testing user/team context...');
  try {
    const userUrl = 'https://api.vercel.com/v2/user';
    const userResponse = await fetch(userUrl, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (userResponse.ok) {
      const user = await userResponse.json();
      console.log('✅ User context verified!');
      console.log(`   User: ${user.user.username}`);
      console.log(`   Email: ${user.user.email}`);
    } else {
      console.error('❌ User context failed:', userResponse.status);
    }
  } catch (error) {
    console.error('❌ User API call failed:', error.message);
  }

  if (teamId) {
    console.log('\n4️⃣ Testing team access...');
    try {
      const teamUrl = `https://api.vercel.com/v2/teams/${teamId}`;
      const teamResponse = await fetch(teamUrl, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });

      if (teamResponse.ok) {
        const team = await teamResponse.json();
        console.log('✅ Team access verified!');
        console.log(`   Team: ${team.name || team.slug}`);
      } else {
        console.error('❌ Team access failed:', teamResponse.status);
        console.error('   This might indicate the token doesn\'t have access to this team');
      }
    } catch (error) {
      console.error('❌ Team API call failed:', error.message);
    }
  }

  console.log('\n📝 Summary:');
  console.log('If any of the above tests failed, you may need to:');
  console.log('1. Regenerate your token with the correct permissions');
  console.log('2. Ensure the token has access to the specific team/project');
  console.log('3. Verify the project ID and team ID are correct');
}

testVercelAPI().catch(console.error);