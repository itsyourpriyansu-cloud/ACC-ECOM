'use client'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import React, { useMemo } from 'react'

type BaseProps = {
  className?: string
  currencyCodeClassName?: string
  as?: 'span' | 'p'
}

type PriceFixed = {
  amount: number
  currencyCode?: string
  highestAmount?: never
  lowestAmount?: never
}

type PriceRange = {
  amount?: never
  currencyCode?: string
  highestAmount: number
  lowestAmount: number
}

type Props = BaseProps & (PriceFixed | PriceRange)

export const Price = ({
  amount,
  className,
  highestAmount,
  lowestAmount,
  currencyCode: currencyCodeFromProps,
  as = 'p',
}: Props & React.ComponentProps<'p'>) => {
  const { formatCurrency, supportedCurrencies } = useCurrency()

  const Element = as

  const currencyToUse = useMemo(() => {
    if (currencyCodeFromProps) {
      return supportedCurrencies.find((currency) => currency.code === currencyCodeFromProps)
    }
    return undefined
  }, [currencyCodeFromProps, supportedCurrencies])

  if (typeof amount === 'number') {
    if (currencyCodeFromProps === 'INR') {
      return (
        <Element className={className} suppressHydrationWarning>
          {new Intl.NumberFormat('en-IN', {
            currency: 'INR',
            maximumFractionDigits: 0,
            style: 'currency',
          }).format(amount / 100)}
        </Element>
      )
    }

    return (
      <Element className={className} suppressHydrationWarning>
        {formatCurrency(amount, { currency: currencyToUse })}
      </Element>
    )
  }

  if (highestAmount && highestAmount !== lowestAmount) {
    if (currencyCodeFromProps === 'INR') {
      const formatINR = (value: number) =>
        new Intl.NumberFormat('en-IN', {
          currency: 'INR',
          maximumFractionDigits: 0,
          style: 'currency',
        }).format(value / 100)
      return <Element className={className}>{`${formatINR(lowestAmount)} - ${formatINR(highestAmount)}`}</Element>
    }
    return (
      <Element className={className} suppressHydrationWarning>
        {`${formatCurrency(lowestAmount, { currency: currencyToUse })} - ${formatCurrency(highestAmount, { currency: currencyToUse })}`}
      </Element>
    )
  }

  if (lowestAmount) {
    if (currencyCodeFromProps === 'INR') {
      return (
        <Element className={className} suppressHydrationWarning>
          {new Intl.NumberFormat('en-IN', {
            currency: 'INR',
            maximumFractionDigits: 0,
            style: 'currency',
          }).format(lowestAmount / 100)}
        </Element>
      )
    }
    return (
      <Element className={className} suppressHydrationWarning>
        {`${formatCurrency(lowestAmount, { currency: currencyToUse })}`}
      </Element>
    )
  }

  return null
}
