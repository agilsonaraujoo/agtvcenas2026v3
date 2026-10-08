// Lista de nomes já usados
export const usedNames = new Set();

export const maleNames = [
  'João', 'Pedro', 'Lucas', 'Carlos', 'André', 'Rafael', 'Bruno', 'Felipe',
  'Gabriel', 'Diego', 'Marcos', 'Leonardo', 'Daniel', 'Thiago', 'Matheus', 'Luciano',
  'Rodrigo', 'Ricardo', 'Henrique', 'Guilherme', 'Vinicius', 'Eduardo', 'Caio', 'Bruno',
  'Leonardo', 'Rafael', 'Diego', 'Carlos', 'André', 'Thiago', 'Daniel', 'Lucas',
  'João', 'Felipe', 'Gabriel', 'Ricardo', 'Rodrigo', 'Henrique', 'Guilherme', 'Vinicius',
  'Eduardo', 'Caio', 'Marcos', 'Leonardo', 'Matheus', 'Luciano', 'Rafael', 'Diego'
];

export const femaleNames = [
  'Maria', 'Ana', 'Isabela', 'Juliana', 'Camila', 'Larissa', 'Fernanda', 'Carolina',
  'Fabiana', 'Lívia', 'Bruna', 'Mariana', 'Natália', 'Gabriela', 'Vitória', 'Beatriz',
  'Carla', 'Cristina', 'Daniela', 'Erika', 'Fátima', 'Giovana', 'Helena', 'Ivone',
  'Jéssica', 'Kelly', 'Lívia', 'Mariana', 'Natália', 'Olivia', 'Patrícia', 'Quel',
  'Raquel', 'Sabrina', 'Tatiana', 'Ursula', 'Valentina', 'Wanda', 'Ximena', 'Yara',
  'Zélia'
];

export const maleLastNames = [
  'Silva', 'Santos', 'Oliveira', 'Ferreira', 'Pereira', 'Souza', 'Lima', 'Rocha',
  'Costa', 'Ribeiro', 'Mendes', 'Alves', 'Gomes', 'Martins', 'Moraes', 'Cardoso',
  'Rodrigues', 'Dias', 'Fernandes', 'Cruz', 'Nunes', 'Pinto', 'Cavalcanti', 'Correia',
  'Barbosa', 'Andrade', 'Pereira', 'Melo', 'Lima', 'Rocha', 'Costa', 'Ribeiro',
  'Mendes', 'Alves', 'Gomes', 'Martins', 'Moraes', 'Cardoso', 'Rodrigues', 'Dias',
  'Fernandes', 'Cruz', 'Nunes', 'Pinto', 'Cavalcanti', 'Correia', 'Barbosa', 'Ferreira'
];

export const femaleLastNames = [
  'Silva', 'Santos', 'Oliveira', 'Ferreira', 'Pereira', 'Souza', 'Lima', 'Rocha',
  'Costa', 'Ribeiro', 'Mendes', 'Alves', 'Gomes', 'Martins', 'Moraes', 'Cardoso',
  'Rodrigues', 'Dias', 'Fernandes', 'Cruz', 'Nunes', 'Pinto', 'Cavalcanti', 'Correia',
  'Barbosa', 'Andrade', 'Pereira', 'Melo', 'Lima', 'Rocha', 'Costa', 'Ribeiro',
  'Mendes', 'Alves', 'Gomes', 'Martins', 'Moraes', 'Cardoso', 'Rodrigues', 'Dias',
  'Fernandes', 'Cruz', 'Nunes', 'Pinto', 'Cavalcanti', 'Correia', 'Barbosa', 'Ferreira'
];

export const generateUniqueName = (gender) => {
  const names = gender === 'male' ? maleNames : femaleNames;
  const lastNames = gender === 'male' ? maleLastNames : femaleLastNames;
  
  let name;
  do {
    name = `${names[Math.floor(Math.random() * names.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  } while (usedNames.has(name));
  
  usedNames.add(name);
  return name;
};

export const testimonials = [
  {
    id: 1,
    name: "João Silva",
  testimonial: "Finalmente encontrei um serviço de streaming que realmente funciona! A qualidade das transmissões e o suporte são excelentes. Recomendo para todos!",
    image: "masculino1.jpeg",
    rating: 5
  },
  {
    id: 2,
    name: "Maria Santos",
  testimonial: "A AGTV mudou completamente a forma como assisto TV. A variedade de conteúdos e a qualidade do streaming são impressionantes. Meus filhos adoram!",
    image: "feminina1.jpeg",
    rating: 5
  },
  {
    id: 3,
    name: "Carlos Oliveira",
  testimonial: "O melhor custo-benefício do mercado! Acesso a transmissões e conteúdos nunca foi tão fácil e barato. A interface é intuitiva e o suporte técnico é muito atencioso.",
    image: "masculino2.jpeg",
    rating: 4.5
  },
  {
    id: 4,
    name: "Ana Pereira",
    testimonial: "Como fã de filmes e séries, a AGTV é perfeita para mim. A qualidade do streaming é excelente e o catálogo é sempre atualizado com novidades.",
    image: "feminina2.jpeg",
    rating: 5
  },
  {
    id: 5,
    name: "Rafael Lima",
    testimonial: "O suporte técnico da AGTV é incrível! Sempre que precisei de ajuda, foram muito atenciosos e resolveram rapidamente. Recomendo demais!",
    image: "masculino3.jpeg",
    rating: 5
  },
  {
    id: 6,
    name: "Juliana Costa",
    testimonial: "A qualidade do streaming é incrível! Não tenho mais problemas com buffer ou travamentos. A AGTV é minha nova favorita!",
    image: "feminina3.jpeg",
    rating: 4.8
  },
  {
    id: 7,
    name: "Bruno Mendes",
    testimonial: "Como fã de esportes, a AGTV é perfeita! Todos os jogos que quero assistir estão disponíveis com qualidade HD. Recomendo!",
    image: "masculino4.jpeg",
    rating: 5
  },
  {
    id: 8,
    name: "Larissa Cardoso",
    testimonial: "A AGTV é incrível para a família! Tem conteúdo para todos os gostes e a qualidade do streaming é excelente. Meus filhos adoram!",
    image: "feminina4.jpeg",
    rating: 5
  }
];
