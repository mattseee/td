function getEffectivePrice(prices, productPromotions, promotions, branchId) {
  const today = new Date()

  const branchPrice = prices.find(p =>
    p.branch_id === branchId &&
    new Date(p.valid_from) <= today &&
    new Date(p.valid_to) >= today
  )
  if (!branchPrice) return null

  const activePromo = productPromotions
    .map(pp => ({
      pp,
      promo: promotions.find(pr =>
        pr.promotion_id === pp.promotion_id &&
        new Date(pr.valid_from) <= today &&
        new Date(pr.valid_to) >= today
      )
    }))
    .find(({ promo }) => promo != null)

  const original = parseFloat(branchPrice.price)

  if (activePromo?.promo) {
    const fp = parseFloat(activePromo.pp.promo_price)
    return {
      finalPrice: fp,
      originalPrice: original,
      promoName: activePromo.promo.NAME,
      discountPercent: Math.round((1 - fp / original) * 100),
      priceType: 'promo',
    }
  }

  if (branchPrice.discount_price && parseFloat(branchPrice.discount_price) < original) {
    const fp = parseFloat(branchPrice.discount_price)
    return {
      finalPrice: fp,
      originalPrice: original,
      promoName: null,
      discountPercent: Math.round((1 - fp / original) * 100),
      priceType: 'discount',
    }
  }

  return {
    finalPrice: original,
    originalPrice: original,
    promoName: null,
    discountPercent: 0,
    priceType: 'regular',
  }
}

module.exports = { getEffectivePrice }
