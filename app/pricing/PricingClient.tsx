'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Checkout from '@/components/Checkout'

type Plan = {
  id: string
  name: string
  priceMonthly: number
  description: string
  features: string[]
  highlight?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    description: 'Basic resume creation & templates',
    features: [
      '3 resume templates',
      'Local resume storage',
      'Basic AI suggestions',
      'Export PDF'
    ]
  },
  {
    id: 'supporter',
    name: 'Supporter',
    priceMonthly: 10,
    description: 'Higher daily limits for AI regenerate, downloads, cover letters, and analysis.',
    highlight: true,
    features: [
      '15 daily regenerations/downloads',
      'Higher analysis & cover letter limits',
      'All templates unlocked',
      'Priority support'
    ]
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    priceMonthly: 20,
    description: 'Unlimited usage on all AI/PDF actions plus future premium features.',
    features: [
      'Unlimited regenerations/downloads',
      'Unlimited analysis & cover letters',
      'All templates + future releases',
      'Priority support'
    ]
  },
]

export default function PricingClient() {
  const [selectedProduct, setSelectedProduct] = useState<'supporter' | 'ultimate' | null>(null)

  const formatPrice = (plan: Plan) =>
    plan.priceMonthly === 0 ? 'Free' : `$${plan.priceMonthly}/mo`

  const showPricing = process.env.NEXT_PUBLIC_SHOW_PRICING === 'true'

  if (!showPricing) {
    return (
      <section className="py-20 px-6 sm:px-8 lg:px-12 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-extrabold">Plans (Hidden)</h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            This page is not publicly linked yet. We&apos;re polishing plans and limits — stay tuned.
          </p>
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            If you need early access or want to become a supporter, contact us at{' '}
            <a href="/contact" className="text-indigo-600 hover:underline">Contact</a>.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="plans-heading" className="py-12 px-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="text-center mb-8">
          <h1 id="plans-heading" className="text-3xl font-extrabold">Plans for every resume builder</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
            Start free — upgrade for higher AI/PDF limits with Supporter or go unlimited with Ultimate.
          </p>
        </header>

        <div className="flex items-center justify-center flex-wrap gap-6">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`max-w-[300px] h-full relative rounded-lg border p-6 flex flex-col justify-between bg-white dark:bg-slate-800 ${
                plan.highlight
                  ? 'ring-2 ring-indigo-500 border-transparent shadow-lg'
                : 'border-gray-200/50 dark:border-slate-700'
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
                <h2 id={`plan-${plan.id}`} className="text-lg font-semibold">{plan.name}</h2>
                <p className="mt-2 text-2xl font-bold">{formatPrice(plan)}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{plan.description}</p>

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
                {plan.id === 'free' ? (
                  <Link
                    href="/auth/newuser"
                    className="inline-flex w-full justify-center items-center px-4 py-2 rounded-md font-medium focus:outline-none bg-gray-50 text-gray-900 border border-gray-200/50 hover:bg-gray-100 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700"
                    aria-label={`Choose ${plan.name} plan`}
                  >
                    Get started free
                  </Link>
                ) : (
                  <button
                    onClick={() => setSelectedProduct(plan.id as 'supporter' | 'ultimate')}
                    className={`inline-flex w-full justify-center items-center px-4 py-2 rounded-md font-medium focus:outline-none ${
                      plan.highlight
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-50 text-gray-900 border border-gray-200/50 hover:bg-gray-100 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700'
                    }`}
                    aria-label={`Checkout ${plan.name}`}
                  >
                    Subscribe
                  </button>
                )}
                <p className="mt-3 text-xs text-gray-500">Secure checkout. Cancel anytime.</p>
              </div>
            </article>
          ))}
        </div>

        {selectedProduct && (
          <div className="mt-10 max-w-2xl mx-auto border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-semibold mb-3">
              Checkout ({selectedProduct === 'supporter' ? 'Supporter' : 'Ultimate'})
            </h3>
            <Checkout productId={selectedProduct} />
          </div>
        )}

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
