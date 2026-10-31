// Resolve as imagens locais das artes para uso consistente nas fixtures.
export const artwork = {
  emerald: new URL('../../../assets/NFT Artwork 03.png', import.meta.url).href,
  sage: new URL('../../../assets/NFT Artwork 04.png', import.meta.url).href,
  ivory: new URL('../../../assets/NFT Artwork 05.png', import.meta.url).href,
  golden: new URL('../../../assets/NFT Artwork 10.png', import.meta.url).href,
} as const
