import { plans } from './pricingPlans';

// Preços por mês de cada plano, calculados a partir dos planos do site (fonte única).
const perMonth = (plan) => (Number(plan.price.replace(',', '.')) / plan.billedMonths).toFixed(2).replace('.', ',');
const priceList = plans.map((plan) => (
  plan.billedMonths === 1
    ? `${plan.name}: R$ ${plan.price}`
    : `${plan.name}: R$ ${plan.price} (sai R$ ${perMonth(plan)}/mês)`
)).join(' • ');

export const faqCategories = [
  { id: 'comecar', label: 'Começar' },
  { id: 'aparelhos', label: 'Aparelhos e internet' },
  { id: 'planos', label: 'Planos e pagamento' },
  { id: 'suporte', label: 'Suporte' },
];

export const faqs = [
  {
    category: 'comecar',
    question: 'O que é a AGTV e como funciona?',
    answer: 'A AGTV reúne filmes, séries e canais ao vivo num só lugar, pela internet. Você escolhe um plano, a gente indica o aplicativo certo para o seu aparelho, ajuda na instalação e você já começa a assistir.',
  },
  {
    category: 'comecar',
    question: 'Como faço o teste grátis?',
    answer: 'É só chamar a gente no WhatsApp ou tocar em "Teste grátis" no topo do site. Liberamos o acesso de teste e explicamos o passo a passo no seu aparelho.',
  },
  {
    category: 'comecar',
    question: 'O serviço é legal?',
    answer: 'Sim, a AGTV é um produto legal e seguro para quem busca entretenimento de qualidade. O serviço é desenvolvido para atender às necessidades dos usuários, respeitando padrões de excelência e confiabilidade.',
  },
  {
    category: 'aparelhos',
    question: 'Em quais aparelhos funciona?',
    answer: 'Smart TVs (Samsung, LG, Roku, TCL e outras com Android TV), TV Box e sticks (MXQ, Mi Box, Mi Stick, Fire Stick), celulares Android, iPhone e iPad, e computador. Alguns aplicativos de TV cobram uma licença anual à parte; nossa equipe te avisa antes de instalar.',
  },
  {
    category: 'aparelhos',
    question: 'Qual internet eu preciso?',
    answer: 'Recomendamos pelo menos 10 Mbps para assistir com estabilidade. Para Full HD e 4K, quanto mais rápida a conexão, melhor. Se possível, ligue a TV no cabo de rede ou perto do roteador.',
  },
  {
    category: 'aparelhos',
    question: 'Posso assistir em mais de uma tela ao mesmo tempo?',
    answer: 'Os planos atuais incluem 1 tela por vez. Se você precisa de mais telas, fale com a gente no WhatsApp que montamos a melhor opção.',
  },
  {
    category: 'aparelhos',
    question: 'Qual é a qualidade da imagem?',
    answer: 'O plano Mensal tem HD e Full HD. Os planos Trimestral, Semestral e Anual chegam a 4K. A qualidade final depende também do seu aparelho e da sua internet.',
  },
  {
    category: 'planos',
    question: 'Quanto custa?',
    answer: `${priceList}. Quanto mais longo o plano, menor o valor por mês.`,
  },
  {
    category: 'planos',
    question: 'Como faço o pagamento?',
    answer: 'Escolha o plano na seção Planos e toque em assinar: você vai para o link de pagamento seguro daquele plano. Depois é só nos mandar o comprovante pelo WhatsApp que liberamos o acesso.',
  },
  {
    category: 'suporte',
    question: 'Como funciona o suporte?',
    answer: 'Pelo WhatsApp, 7 dias por semana, com atendimento de pessoas de verdade. A gente ajuda a instalar, configurar e resolver qualquer problema.',
  },
  {
    category: 'suporte',
    question: 'Travou ou parou de funcionar. O que faço?',
    answer: 'Primeiro, reinicie o aplicativo e o aparelho e confira se a internet está funcionando. Se continuar, chame a gente no WhatsApp com uma foto da tela que resolvemos com você.',
  },
];
