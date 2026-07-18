import React, { Fragment } from 'react'

import type { Props } from './types'

import { Image } from './Image'
import { Video } from './Video'

export const Media: React.FC<Props> = (props) => {
  const { className, htmlElement = 'div', resource } = props

  const isVideo = typeof resource === 'object' && resource?.mimeType?.includes('video')
  const media = isVideo ? <Video {...props} /> : <Image {...props} alt={props.alt || ''} />

  return htmlElement ? React.createElement(htmlElement, { className }, media) : <Fragment>{media}</Fragment>
}
