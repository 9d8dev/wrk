import { Section, Container } from "@/components/ds";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ArrowLeft, FileText, AlertTriangle, Scale, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfUse() {
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
              <FileText className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">Terms of Use</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              These terms govern your use of Wrk.so and outline our mutual rights and responsibilities.
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

              {/* Quick Summary */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Quick Summary
                </h2>
                <ul className="space-y-2 text-sm">
                  <li>• You keep full ownership of your content and portfolios</li>
                  <li>• Use our service responsibly and don't violate others' rights</li>
                  <li>• We provide the service "as is" with reasonable effort to maintain uptime</li>
                  <li>• Either party can terminate the agreement with notice</li>
                </ul>
              </div>

              {/* Acceptance */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    By accessing or using Wrk.so ("Service"), you agree to be bound by these Terms of Use ("Terms"). 
                    If you disagree with any part of these terms, you may not access the Service.
                  </p>
                  <p className="text-muted-foreground">
                    These Terms apply to all visitors, users, and others who access or use the Service.
                  </p>
                </div>
              </section>

              <Separator />

              {/* Description of Service */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Wrk.so is a portfolio platform that allows users to create, customize, and share professional portfolios 
                    to showcase their work and attract clients.
                  </p>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Our Service Includes:</h3>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• Portfolio creation and hosting tools</li>
                      <li>• Customizable templates and themes</li>
                      <li>• Analytics and visitor insights</li>
                      <li>• Custom domain support (Pro users)</li>
                      <li>• Client inquiry management</li>
                    </ul>
                  </div>
                </div>
              </section>

              <Separator />

              {/* User Accounts */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Account Creation</h3>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• You must provide accurate and complete information when creating an account</li>
                      <li>• You are responsible for safeguarding your password</li>
                      <li>• You must notify us immediately of any unauthorized use of your account</li>
                      <li>• One person may not maintain more than one free account</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Account Responsibilities</h3>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• You are responsible for all activities that occur under your account</li>
                      <li>• You must keep your contact information up to date</li>
                      <li>• You may not share your account with others</li>
                      <li>• You must be at least 13 years old to create an account</li>
                    </ul>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Content and Intellectual Property */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Content and Intellectual Property</h2>
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2 text-green-800 dark:text-green-200">
                      Your Content Rights
                    </h3>
                    <ul className="space-y-1 text-green-700 dark:text-green-300">
                      <li>• You retain full ownership of all content you upload</li>
                      <li>• You can download or export your content at any time</li>
                      <li>• You can delete your content and account whenever you want</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Content License to Us</h3>
                    <p className="text-muted-foreground mb-2">
                      By uploading content, you grant us a limited license to:
                    </p>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• Store and display your content as part of the Service</li>
                      <li>• Make technical copies for backup and performance</li>
                      <li>• Allow others to view your public portfolios</li>
                      <li>• Use aggregated, anonymized data for service improvements</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      This license ends when you delete your content or terminate your account.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Content Standards</h3>
                    <p className="text-muted-foreground mb-2">Your content must not:</p>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• Violate any laws or regulations</li>
                      <li>• Infringe on others' intellectual property rights</li>
                      <li>• Contain hateful, threatening, or explicit material</li>
                      <li>• Include spam, malware, or malicious code</li>
                      <li>• Impersonate others or misrepresent your identity</li>
                    </ul>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Prohibited Uses */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  5. Prohibited Uses
                </h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    You may not use our Service:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• For any unlawful purpose</li>
                      <li>• To harass or abuse others</li>
                      <li>• To distribute malware or viruses</li>
                      <li>• To scrape or copy our content</li>
                    </ul>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• To interfere with our servers</li>
                      <li>• To create fake accounts</li>
                      <li>• To violate others' privacy</li>
                      <li>• To compete directly with us</li>
                    </ul>
                  </div>
                  
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-200">
                      <strong>Violation Consequences:</strong> We may suspend or terminate accounts that violate these terms without notice.
                    </p>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Payment Terms */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-6 h-6" />
                  6. Payment Terms
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Subscription Plans</h3>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• Free plan: Basic features with Wrk.so branding</li>
                      <li>• Pro plan: Advanced features, custom domains, priority support</li>
                      <li>• Pricing is displayed clearly before purchase</li>
                      <li>• All prices are in USD unless otherwise specified</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Billing and Refunds</h3>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• Pro subscriptions are billed monthly or annually</li>
                      <li>• Payments are processed securely through Polar</li>
                      <li>• Refunds are available within 30 days of purchase</li>
                      <li>• You can cancel your subscription at any time</li>
                      <li>• Service continues until the end of your billing period</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Price Changes</h3>
                    <p className="text-muted-foreground">
                      We may change our pricing with 30 days' notice. Current subscribers will be 
                      grandfathered at their existing price for their current billing cycle.
                    </p>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Service Availability */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Service Availability</h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    We strive to provide reliable service but cannot guarantee 100% uptime. We may:
                  </p>
                  <ul className="space-y-1 text-muted-foreground ml-4">
                    <li>• Perform scheduled maintenance with advance notice</li>
                    <li>• Make emergency updates for security or stability</li>
                    <li>• Experience temporary outages due to technical issues</li>
                    <li>• Modify or discontinue features with reasonable notice</li>
                  </ul>
                  
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-blue-800 dark:text-blue-200">
                      <strong>Service Updates:</strong> We'll notify users of significant changes through email or in-app notifications.
                    </p>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Privacy */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Privacy</h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-muted-foreground">
                      📋 <strong>Read our full </strong>
                      <Link href="/privacy" className="text-primary hover:underline font-medium">
                        Privacy Policy
                      </Link>
                      <strong> for detailed information about data handling.</strong>
                    </p>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Disclaimers and Limitation of Liability */}
              <section>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Scale className="w-6 h-6" />
                  9. Disclaimers and Limitation of Liability
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Service Disclaimers</h3>
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                        The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind. 
                        We do not guarantee that the Service will be error-free, secure, or continuously available.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Limitation of Liability</h3>
                    <p className="text-muted-foreground text-sm">
                      To the maximum extent permitted by law, Wrk.so shall not be liable for any indirect, 
                      incidental, special, or consequential damages arising from your use of the Service. 
                      Our total liability is limited to the amount you paid us in the 12 months preceding the claim.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">User Responsibility</h3>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• You are responsible for backing up your content</li>
                      <li>• We are not liable for content loss or corruption</li>
                      <li>• You assume all risks associated with using the Service</li>
                      <li>• You agree to indemnify us against claims arising from your use</li>
                    </ul>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Termination */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Your Rights</h3>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• You may delete your account at any time</li>
                      <li>• You can export your data before termination</li>
                      <li>• Paid subscriptions continue until the end of the billing period</li>
                      <li>• You remain responsible for charges incurred before termination</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Our Rights</h3>
                    <ul className="space-y-1 text-muted-foreground ml-4">
                      <li>• We may suspend accounts for Terms violations</li>
                      <li>• We may terminate accounts with 30 days' notice</li>
                      <li>• We may immediately terminate for serious violations</li>
                      <li>• We will provide data export opportunities when possible</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Effect of Termination</h3>
                    <p className="text-muted-foreground">
                      Upon termination, your right to use the Service ends immediately. We will delete your 
                      account data within 30 days unless legally required to retain it.
                    </p>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Changes to Terms */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    We may update these Terms from time to time. We will notify users of material changes by:
                  </p>
                  <ul className="space-y-1 text-muted-foreground ml-4">
                    <li>• Email notification to account holders</li>
                    <li>• In-app notification when you next sign in</li>
                    <li>• Updating the "Last updated" date above</li>
                    <li>• Posting notice on our website</li>
                  </ul>
                  <p className="text-muted-foreground">
                    Continued use of the Service after changes constitutes acceptance of the new Terms.
                  </p>
                </div>
              </section>

              <Separator />

              {/* Governing Law */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    These Terms are governed by the laws of [Your State/Country] without regard to conflict of law principles. 
                    Any disputes will be resolved in the courts of [Your Jurisdiction].
                  </p>
                  <p className="text-muted-foreground text-sm">
                    If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.
                  </p>
                </div>
              </section>

              <Separator />

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
                <div className="bg-muted/50 rounded-lg p-6">
                  <p className="text-muted-foreground mb-4">
                    If you have any questions about these Terms or our Service, please contact us:
                  </p>
                  <div className="space-y-2">
                    <p><strong>Email:</strong> <Link href="mailto:legal@wrk.so" className="text-primary hover:underline">legal@wrk.so</Link></p>
                    <p><strong>Support:</strong> <Link href="mailto:support@wrk.so" className="text-primary hover:underline">support@wrk.so</Link></p>
                    <p><strong>Address:</strong> [Your Business Address]</p>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      <strong>Effective Date:</strong> These Terms are effective as of December 2024 and apply to all users of the Service.
                    </p>
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