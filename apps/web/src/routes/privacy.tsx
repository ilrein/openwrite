import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/privacy")({
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
        <h1 className="mb-2 font-bold text-3xl">Privacy Policy</h1>
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
              OpenWrite ("we," "our," or "us") is committed to protecting your privacy. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your information when you
              use our AI-powered writing platform.
            </p>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card>
          <CardHeader>
            <CardTitle>Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <h3>Personal Information</h3>
            <ul>
              <li>Email address (for account creation and authentication)</li>
              <li>Name (optional, for personalization)</li>
              <li>Writing content and documents you create</li>
            </ul>

            <h3>Automatically Collected Information</h3>
            <ul>
              <li>Usage data and analytics</li>
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </CardContent>
        </Card>

        {/* How We Use Your Information */}
        <Card>
          <CardHeader>
            <CardTitle>How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and maintain our writing platform</li>
              <li>Authenticate your account and ensure security</li>
              <li>Save and sync your writing content across devices</li>
              <li>Improve our AI assistance features</li>
              <li>Analyze usage patterns to enhance user experience</li>
              <li>Communicate with you about updates and features</li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Storage and Security */}
        <Card>
          <CardHeader>
            <CardTitle>Data Storage and Security</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              Your data is stored securely using industry-standard encryption. We use Cloudflare D1
              for data storage, which provides enterprise-grade security and compliance. Your
              writing content is encrypted both in transit and at rest.
            </p>
            <p>
              We implement appropriate technical and organizational measures to protect your
              personal information against unauthorized access, alteration, disclosure, or
              destruction.
            </p>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card>
          <CardHeader>
            <CardTitle>Data Sharing and Disclosure</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third
              parties, except:
            </p>
            <ul>
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>In connection with a business transfer or merger</li>
            </ul>
            <p>
              We may use anonymized and aggregated data for research and analytics purposes that
              cannot be used to identify individual users.
            </p>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <CardTitle>Your Rights</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Export your writing content</li>
              <li>Opt out of marketing communications</li>
              <li>Withdraw consent where applicable</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the information provided in the
              "Contact Us" section below.
            </p>
          </CardContent>
        </Card>

        {/* Cookies and Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>Cookies and Tracking Technologies</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              We use cookies and similar technologies to enhance your experience, remember your
              preferences, and analyze usage patterns. You can control cookie preferences through
              your browser settings.
            </p>
            <p>
              Essential cookies are necessary for the platform to function properly and cannot be
              disabled. Optional cookies help us improve our services and can be disabled at any
              time.
            </p>
          </CardContent>
        </Card>

        {/* Open Source */}
        <Card>
          <CardHeader>
            <CardTitle>Open Source Commitment</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              OpenWrite is an open-source project licensed under AGPL-3.0. Our source code is
              publicly available on GitHub, allowing for transparency and community review of our
              privacy and security practices.
            </p>
            <p>
              You can review our data handling practices, security implementations, and privacy
              measures by examining our source code at{" "}
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

        {/* Changes to Policy */}
        <Card>
          <CardHeader>
            <CardTitle>Changes to This Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any
              significant changes by posting the new Privacy Policy on this page and updating the
              "Last updated" date.
            </p>
            <p>
              Your continued use of OpenWrite after any changes indicates your acceptance of the
              updated Privacy Policy.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <p>
              If you have any questions about this Privacy Policy or our privacy practices, please
              contact us:
            </p>
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
