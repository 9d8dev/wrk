import { Section, Container } from "@/components/ds";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ArrowLeft, Shield, Eye, Lock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <Section className="pt-8 pb-4">
        <Container>
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
          
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              We&apos;re committed to protecting your privacy and being transparent about how we collect, use, and share your information.
            </p>
            <Badge variant="secondary" className="px-4 py-2">
              Last updated: December 2024
            </Badge>
          </div>
        </Container>
      </Section>

      {/* Main Content */}
      <Section className="pb-16">
        <Container>
          <Card className="max-w-4xl mx-auto p-8 shadow-lg">
            <div className="space-y-8">

              {/* Quick Overview */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Quick Overview
                </h2>
                <ul className="space-y-2 text-sm">
                  <li>• We collect only the information necessary to provide our portfolio service</li>
                  <li>• We never sell your personal data to third parties</li>
                  <li>• You have full control over your data and can delete your account anytime</li>
                  <li>• We use industry-standard security measures to protect your information</li>
                </ul>
              </div>

              {/* Information We Collect */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Information You Provide</h3>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• Account information (email, username, password)</li>
                      <li>• Profile information (name, bio, profile picture)</li>
                      <li>• Portfolio content (projects, descriptions, images)</li>
                      <li>• Contact information for client inquiries</li>
                      <li>• Payment information (processed securely through Polar)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Automatically Collected Information</h3>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• Usage analytics (page views, time spent, interactions)</li>
                      <li>• Device information (browser type, operating system)</li>
                      <li>• IP address and general location</li>
                      <li>• Cookies and similar tracking technologies</li>
                    </ul>
                  </div>
                </div>
              </section>

              <Separator />

              {/* How We Use Information */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Core Service</h3>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Create and host your portfolio</li>
                      <li>• Provide portfolio analytics</li>
                      <li>• Process payments and subscriptions</li>
                      <li>• Customer support</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Improvements</h3>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Analyze usage patterns</li>
                      <li>• Improve our service</li>
                      <li>• Develop new features</li>
                      <li>• Security and fraud prevention</li>
                    </ul>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Information Sharing */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2 text-green-800 dark:text-green-200">
                      What We DON&apos;T Do
                    </h3>
                    <ul className="space-y-1 text-green-700 dark:text-green-300">
                      <li>• We never sell your personal data</li>
                      <li>• We don&apos;t share data with advertisers</li>
                      <li>• We don&apos;t use your content for AI training without permission</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Limited Sharing</h3>
                    <p className="text-muted-foreground mb-2">We only share information in these specific cases:</p>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• <strong>Service Providers:</strong> Trusted partners who help us operate (hosting, payment processing, analytics)</li>
                      <li>• <strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                      <li>• <strong>Business Transfers:</strong> In case of merger or acquisition (you&apos;ll be notified)</li>
                      <li>• <strong>Your Consent:</strong> When you explicitly authorize sharing</li>
                    </ul>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Data Security */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Lock className="w-6 h-6" />
                  4. Data Security
                </h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    We implement industry-standard security measures to protect your information:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• SSL encryption for all data transmission</li>
                      <li>• Secure password hashing</li>
                      <li>• Regular security audits</li>
                    </ul>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Access controls and monitoring</li>
                      <li>• Secure cloud infrastructure</li>
                      <li>• Regular backups</li>
                    </ul>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Your Rights */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <UserCheck className="w-6 h-6" />
                  5. Your Rights
                </h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    You have the following rights regarding your personal information:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-2">Access & Control</h3>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• View your data</li>
                        <li>• Update your information</li>
                        <li>• Download your data</li>
                        <li>• Delete your account</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Privacy Controls</h3>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Opt out of analytics</li>
                        <li>• Control email preferences</li>
                        <li>• Manage cookie settings</li>
                        <li>• Request data deletion</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-blue-800 dark:text-blue-200">
                      <strong>Exercise Your Rights:</strong> Contact us at{" "}
                      <Link href="mailto:privacy@wrk.so" className="underline">
                        privacy@wrk.so
                      </Link>{" "}
                      to exercise any of these rights.
                    </p>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Cookies */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Cookies & Tracking</h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    We use cookies and similar technologies to improve your experience:
                  </p>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium">Essential Cookies</h3>
                      <p className="text-sm text-muted-foreground">Required for the service to function (authentication, preferences)</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Analytics Cookies</h3>
                      <p className="text-sm text-muted-foreground">Help us understand how you use our service (can be disabled)</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Performance Cookies</h3>
                      <p className="text-sm text-muted-foreground">Improve loading times and user experience</p>
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              {/* International Users */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">7. International Users</h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Wrk.so is operated from the United States. By using our service, you consent to the transfer and processing of your information in the US.
                  </p>
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-yellow-800 dark:text-yellow-200">
                      <strong>EU Users:</strong> We comply with GDPR requirements and provide appropriate safeguards for your data.
                    </p>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Children's Privacy */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Children&apos;s Privacy</h2>
                <p className="text-muted-foreground">
                  Wrk.so is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.
                </p>
              </section>

              <Separator />

              {/* Updates */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Policy Updates</h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    We may update this privacy policy from time to time. We&apos;ll notify you of significant changes by:
                  </p>
                  <ul className="space-y-1 text-muted-foreground ml-4">
                    <li>• Email notification (for material changes)</li>
                    <li>• In-app notification</li>
                    <li>• Updating the &quot;Last updated&quot; date above</li>
                  </ul>
                </div>
              </section>

              <Separator />

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
                <div className="bg-muted/50 rounded-lg p-6">
                  <p className="text-muted-foreground mb-4">
                    If you have any questions about this privacy policy or our data practices, please contact us:
                  </p>
                  <div className="space-y-2">
                    <p><strong>Email:</strong> <Link href="mailto:privacy@wrk.so" className="text-primary hover:underline">privacy@wrk.so</Link></p>
                    <p><strong>Support:</strong> <Link href="mailto:support@wrk.so" className="text-primary hover:underline">support@wrk.so</Link></p>
                    <p><strong>Address:</strong> [Your Business Address]</p>
                  </div>
                </div>
              </section>

            </div>
          </Card>
        </Container>
      </Section>
    </div>
  );
}