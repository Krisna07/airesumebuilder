import Link from "next/link"
import Button from "../Ui/Button"
import { ArrowRight, Sparkles } from "lucide-react"

const CTASection = () => {
  return (
    <section className="w-full py-16 md:py-24 bg-linear-to-br from-teal-600 via-teal-700 to-cyan-600 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Ready to land your dream job?
          </h2>
          <p className="text-lg md:text-xl text-teal-50 mb-8 max-w-2xl mx-auto">
            Join thousands of job seekers who have successfully created professional resumes and landed interviews with Airesumecraft.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/builder">
              <Button variant="primary" size="large" >
                Start Building Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary" size="large" className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 px-8">
                View Pricing
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-teal-50">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">✓</span>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">✓</span>
              <span>Free plan available</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">✓</span>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTASection
