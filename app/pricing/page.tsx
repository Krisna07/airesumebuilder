'use client'

import React, { useState } from 'react'
import Link from 'next/link'

type Billing = 'monthly' | 'yearly'

type Plan = {
  id: string
  name: string
  priceMonthly: number
  priceYearly: number
  description: string
  features: string[]
  highlight?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    description: 'Basic resume creation & templates',
    features: [
      '3 resume templates',
      'Local resume storage',
      'Basic AI suggestions',
      'Export PDF'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 9,
    priceYearly: 90,
    description: 'Best for job seekers using AI to optimize resumes',
    highlight: true,
    features: [
      'Unlimited resumes',
      'AI-driven optimization & matching',
      'ATS-friendly templates',
      'Version history & analytics'
    ]
  }
]

const Page = () => {
  const [billing, setBilling] = useState<Billing>('monthly')

  const formatPrice = (plan: Plan) =>
    billing === 'monthly'
      ? plan.priceMonthly === 0
        ? 'Free'
        : `$${plan.priceMonthly}/mo`
      : plan.priceYearly === 0
      ? 'Free'
      : `$${plan.priceYearly}/yr`

  return (
    <section aria-labelledby="pricing-heading" className="py-12 px-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="text-center mb-8">
          <h2 id="pricing-heading" className="text-3xl font-extrabold">Plans for every resume builder</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
            Start free — upgrade for AI-powered optimization, analytics, and team features.
          </p>
        </header>

        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex items-center bg-gray-100 p-1 rounded-full">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                billing === 'monthly' ? 'bg-white shadow' : 'text-gray-600'
              }`}
              aria-pressed={billing === 'monthly'}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                billing === 'yearly' ? 'bg-white shadow' : 'text-gray-600'
              }`}
              aria-pressed={billing === 'yearly'}
            >
              Yearly (save 2 months)
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center flex-wrap gap-6">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`max-w-[300px] h-full relative rounded-lg border p-6 flex flex-col justify-between bg-white ${
                plan.highlight ? 'ring-2 ring-indigo-500 border-transparent shadow-lg' : 'border-gray-200'
              }`}
              aria-labelledby={`plan-${plan.id}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-6">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-600 text-white">
                    Popular
                  </span>
                </div>
              )}

              <div>
                <h3 id={`plan-${plan.id}`} className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-2 text-2xl font-bold">{formatPrice(plan)}</p>
                <p className="mt-2 text-sm text-gray-600">{plan.description}</p>

                <ul className="mt-4 space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start">
                      <span className="mr-2 text-green-600" aria-hidden>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <Link
                  href={`/signup?plan=${plan.id}&billing=${billing}`}
                  className={`inline-flex w-full justify-center items-center px-4 py-2 rounded-md font-medium focus:outline-none ${
                    plan.highlight
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-50 text-gray-900 border border-gray-200 hover:bg-gray-100'
                  }`}
                  aria-label={`Choose ${plan.name} plan`}
                >
                  {plan.priceMonthly === 0 && plan.priceYearly === 0 ? 'Get started' : plan.highlight ? 'Start free trial' : 'Choose plan'}
                </Link>

                <p className="mt-3 text-xs text-gray-500">
                  Secure checkout. Cancel anytime.
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 text-sm text-center text-gray-600">
          <p>
            Need an enterprise or custom plan?{' '}
            <Link href="/contact" className="text-indigo-600 hover:underline">Contact us</Link>.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Page