export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

// Ombres douces style iOS — 3 profondeurs seulement, utilisées partout
export const shadow = {
  // Cartes au repos (KPI cards, list rows)
  soft: {
    shadowColor: "#1a1c1a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  // Cartes importantes / headers flottants
  medium: {
    shadowColor: "#1a1c1a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  // Modals / bottom sheets
  strong: {
    shadowColor: "#1a1c1a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
};