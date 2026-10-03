import { maleNames, femaleNames, maleLastNames, femaleLastNames, usedNames } from './testimonials';

const generateUniqueName = (gender) => {
  const names = gender === 'male' ? maleNames : femaleNames;
  const lastNames = gender === 'male' ? maleLastNames : femaleLastNames;
  
  let name;
  do {
    name = `${names[Math.floor(Math.random() * names.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  } while (usedNames.has(name));
  
  usedNames.add(name);
  return name;
};

export const subscriptionMessages = [
  {
    id: 1,
    name: generateUniqueName('female'),
    plan: "Mensal",
    message: "acabou de assinar o plano Mensal e já está aproveitando todos os conteúdos!"
  },
  {
    id: 2,
    name: generateUniqueName('male'),
    plan: "Quadrimestral",
    message: "acabou de assinar o plano Quadrimestral e já está economizando!"
  },
  {
    id: 3,
    name: generateUniqueName('female'),
    plan: "Semestral",
    message: "acabou de assinar o plano Semestral (5+1) e já está aproveitando o melhor custo-benefício!"
  },
  {
    id: 4,
    name: generateUniqueName('male'),
    plan: "Anual",
    message: "acabou de assinar o plano Anual (10+2) e já está aproveitando o maior desconto!"
  },
  {
    id: 5,
    name: generateUniqueName('female'),
    plan: "Mensal",
    message: "acabou de assinar o plano Mensal e já está assistindo seus filmes favoritos!"
  },
  {
    id: 6,
    name: generateUniqueName('male'),
    plan: "Quadrimestral",
    message: "acabou de assinar o plano Quadrimestral e já está aproveitando a qualidade HD/4K!"
  },
  {
    id: 7,
    name: generateUniqueName('female'),
    plan: "Família",
    message: "acabou de assinar o plano Família e toda a família já está assistindo!"
  },
  {
    id: 8,
    name: generateUniqueName('male'),
    plan: "Plus",
    message: "acabou de assinar o plano Plus e já está aproveitando os conteúdos em 4K!"
  },
  {
    id: 9,
    name: generateUniqueName('female'),
    plan: "Básico",
    message: "acabou de assinar o plano Básico e já está curtindo seus conteúdos favoritos!"
  },
  {
    id: 10,
    name: generateUniqueName('male'),
    plan: "VIP",
    message: "acabou de assinar o plano VIP e já está aproveitando todos os benefícios!"
  },
  {
    id: 11,
    name: generateUniqueName('female'),
    plan: "Premium",
    message: "acabou de assinar o plano Premium e já está assistindo seus filmes favoritos!"
  },
  {
    id: 12,
    name: generateUniqueName('male'),
    plan: "Família",
    message: "acabou de assinar o plano Família e toda a família já está assistindo!"
  },
  {
    id: 13,
    name: generateUniqueName('female'),
    plan: "Plus",
    message: "acabou de assinar o plano Plus e já está aproveitando os conteúdos em 4K!"
  },
  {
    id: 14,
    name: generateUniqueName('male'),
    plan: "Básico",
    message: "acabou de assinar o plano Básico e já está curtindo seus conteúdos favoritos!"
  },
  {
    id: 15,
    name: generateUniqueName('female'),
    plan: "VIP",
    message: "acabou de assinar o plano VIP e já está aproveitando todos os benefícios!"
  }
];

export const getNewSubscription = () => {
  const randomMessage = subscriptionMessages[Math.floor(Math.random() * subscriptionMessages.length)];
  return {
    name: randomMessage.name,
    plan: randomMessage.plan,
    message: randomMessage.message
  };
};
