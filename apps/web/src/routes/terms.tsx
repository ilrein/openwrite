import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/terms")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button asChild className="mb-4" variant="ghost">
          <Link className="flex items-center gap-2" to="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <h1 className="mb-2 font-bold text-3xl">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="space-y-8">
        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle>Introduction</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              Welcome to OpenWrite. These Terms of Service ("Terms") govern your use of the
              OpenWrite platform ("Service") operated by the OpenWrite project ("us," "we," or
              "our").
            </p>
            <p>
              By accessing or using our Service, you agree to be bound by these Terms. If you
              disagree with any part of these terms, then you may not access the Service.
            </p>
          </CardContent>
        </Card>

        {/* Acceptance of Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              By creating an account or using OpenWrite, you acknowledge that you have read,
              understood, and agree to be bound by these Terms and our Privacy Policy.
            </p>
            <p>
              You must be at least 13 years old to use this Service. If you are under 18, you
              represent that you have your parent's or guardian's permission to use the Service.
            </p>
          </CardContent>
        </Card>

        {/* Description of Service */}
        <Card>
          <CardHeader>
            <CardTitle>Description of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>OpenWrite is an AI-powered writing platform that provides:</p>
            <ul>
              <li>Rich text editing capabilities with real-time collaboration</li>
              <li>AI-assisted writing suggestions and improvements</li>
              <li>Document storage and synchronization</li>
              <li>Export and sharing features</li>
              <li>Writing analytics and insights</li>
            </ul>
            <p>
              The Service is provided on an "as is" basis and may be modified, updated, or
              discontinued at any time without prior notice.
            </p>
          </CardContent>
        </Card>

        {/* User Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>User Accounts</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              To access certain features of the Service, you must create an account. You are
              responsible for:
            </p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and up-to-date information</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
            <p>
              We reserve the right to terminate accounts that violate these Terms or remain inactive
              for extended periods.
            </p>
          </CardContent>
        </Card>

        {/* Acceptable Use */}
        <Card>
          <CardHeader>
            <CardTitle>Acceptable Use Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Upload harmful, offensive, or inappropriate content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Distribute malware or engage in malicious activities</li>
              <li>Spam, harass, or abuse other users</li>
              <li>Use the Service for commercial purposes without permission</li>
            </ul>
            <p>
              We reserve the right to remove content and suspend accounts that violate this policy.
            </p>
          </CardContent>
        </Card>

        {/* Content Ownership and License */}
        <Card>
          <CardHeader>
            <CardTitle>Content Ownership and License</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <h3>Your Content</h3>
            <p>
              You retain ownership of all content you create using OpenWrite. By using the Service,
              you grant us a limited license to store, process, and display your content solely for
              the purpose of providing the Service.
            </p>

            <h3>Our Content</h3>
            <p>
              The OpenWrite platform, including its design, features, and underlying technology, is
              owned by the OpenWrite project and protected by copyright and other intellectual
              property laws.
            </p>

            <h3>Open Source License</h3>
            <p>
              OpenWrite is released under the AGPL-3.0 license. The source code is available at{" "}
              <a
                className="text-primary hover:underline"
                href="https://github.com/ilrein/openwrite"
                rel="noopener noreferrer"
                target="_blank"
              >
                github.com/ilrein/openwrite
              </a>
              .
            </p>
          </CardContent>
        </Card>

        {/* AI and Data Processing */}
        <Card>
          <CardHeader>
            <CardTitle>AI Features and Data Processing</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              OpenWrite uses artificial intelligence to provide writing assistance and suggestions.
              By using these features, you understand that:
            </p>
            <ul>
              <li>AI suggestions are generated automatically and may not always be accurate</li>
              <li>You are responsible for reviewing and validating all AI-generated content</li>
              <li>Your content may be processed to provide AI assistance features</li>
              <li>We do not guarantee the accuracy or quality of AI suggestions</li>
            </ul>
            <p>
              All AI processing is performed securely and in accordance with our Privacy Policy.
            </p>
          </CardContent>
        </Card>

        {/* Service Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Service Availability</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              We strive to maintain high availability of the Service, but we cannot guarantee
              uninterrupted access. The Service may be temporarily unavailable due to:
            </p>
            <ul>
              <li>Scheduled maintenance and updates</li>
              <li>Technical difficulties or system failures</li>
              <li>Third-party service interruptions</li>
              <li>Force majeure events</li>
            </ul>
            <p>
              We will make reasonable efforts to provide notice of planned downtime when possible.
            </p>
          </CardContent>
        </Card>

        {/* Disclaimer of Warranties */}
        <Card>
          <CardHeader>
            <CardTitle>Disclaimer of Warranties</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
              EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p>
              We do not warrant that the Service will be error-free, secure, or continuously
              available.
            </p>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card>
          <CardHeader>
            <CardTitle>Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO
              LOSS OF DATA, PROFITS, OR BUSINESS INTERRUPTION.
            </p>
            <p>
              Our total liability to you for all claims related to the Service shall not exceed the
              amount you paid us in the twelve months preceding the claim.
            </p>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card>
          <CardHeader>
            <CardTitle>Termination</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              You may terminate your account at any time by contacting us or using the account
              deletion feature. Upon termination:
            </p>
            <ul>
              <li>Your access to the Service will be immediately revoked</li>
              <li>Your content may be deleted from our servers</li>
              <li>We may retain certain information as required by law</li>
            </ul>
            <p>
              We may terminate or suspend your account if you violate these Terms or for any other
              reason at our sole discretion.
            </p>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card>
          <CardHeader>
            <CardTitle>Governing Law and Disputes</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              jurisdiction where the OpenWrite project is based, without regard to conflict of law
              principles.
            </p>
            <p>
              Any disputes arising from these Terms or your use of the Service should first be
              addressed through our GitHub issues or direct communication. We encourage good faith
              efforts to resolve disputes amicably.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Changes to These Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              We may update these Terms from time to time. We will notify users of any significant
              changes by posting the new Terms on this page and updating the "Last updated" date.
            </p>
            <p>
              Your continued use of the Service after any changes indicates your acceptance of the
              updated Terms. If you do not agree to the changes, you should discontinue using the
              Service.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>If you have any questions about these Terms of Service, please contact us:</p>
            <ul>
              <li>
                GitHub Issues:{" "}
                <a
                  className="text-primary hover:underline"
                  href="https://github.com/ilrein/openwrite/issues"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  github.com/ilrein/openwrite/issues
                </a>
              </li>
              <li>Email: Available through our GitHub profile</li>
            </ul>
            <p>
              As an open-source project, we welcome community feedback and contributions to improve
              these Terms and the OpenWrite platform.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
