// Preço do plano mensal, usado para calcular a economia dos planos mais longos.
export const monthlyReferencePrice = 34.9;

// Itens iguais em todos os planos: aparecem uma vez só, acima dos cards.
export const commonFeatures = [
  "+22 mil conteúdos",
  "Filmes e séries on demand",
  "Suporte via WhatsApp 7 dias por semana",
];

export const plans = [
  {
    name: "Mensal",
    price: "34,90",
    description: "Comece sem compromisso.",
    billedMonths: 1,
    quality: "HD / Full HD",
    screens: 1,
    isPopular: false,
    paymentUrl: "https://loja.infinitepay.io/agtv_streaming/neg6862-agtv-streaming"
  },
  {
    name: "Trimestral",
    price: "99,90",
    description: "Pague a cada 3 meses.",
    billedMonths: 3,
    quality: "HD / Full HD / 4K",
    screens: 1,
    isPopular: false,
    paymentUrl: "https://loja.infinitepay.io/agtv_streaming/zwi3030-agtv-plano-mensal"
  },
  {
    name: "Semestral",
    price: "159,90",
    description: "Pague a cada 6 meses.",
    billedMonths: 6,
    quality: "HD / Full HD / 4K",
    screens: 1,
    isPopular: true,
    paymentUrl: "https://loja.infinitepay.io/agtv_streaming/vxx2958-agtv-plano-plus"
  },
  {
    name: "Anual",
    price: "249,90",
    description: "Pague uma vez por ano.",
    billedMonths: 12,
    quality: "HD / Full HD / 4K",
    screens: 1,
    highlight: {
      text: "⭐ Melhor custo",
      color: "bg-yellow-500 text-gray-900"
    },
    isPopular: true,
    paymentUrl: "https://loja.infinitepay.io/agtv_streaming/wox2479-agtv-plano-anual"
  }
];
