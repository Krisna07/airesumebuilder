"use client"
import type React from "react"
import { useState, useMemo, memo, useCallback } from "react"
import Image from "next/image"

interface UniversalImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  onError?: () => void
}

const UniversalImage: React.FC<UniversalImageProps> = memo(function UniversalImage({
  src,
  alt,
  width = 32,
  height = 32,
  className = "",
  priority = false,
  onError,
}) {
  const [imageError, setImageError] = useState(false)

  const isExternal = useMemo(() => {
    if (typeof window === "undefined") return src.startsWith("http")
    return src.startsWith("http") && !src.includes(window.location.hostname)
  }, [src])

  const handleError = useCallback(() => {
    setImageError(true)
    onError?.()
  }, [onError])

  // Use regular img for external images or on error
  if (isExternal || imageError || src.startsWith("http")) {
    return (
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
      />
    )
  }

  // Use Next.js Image for internal images
  return (
    <Image
      src={src || "/placeholder.svg"}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={handleError}
    />
  )
})

export default UniversalImage
