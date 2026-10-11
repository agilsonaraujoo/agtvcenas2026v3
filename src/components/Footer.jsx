import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center">
      <div className="container mx-auto">
        <nav aria-label="Atendimento" className="mb-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          <a
            href="https://wa.me/5583986913481"
            target="_blank"
            rel="noopener noreferrer"
            data-analytics="footer_whatsapp"
            className="underline-offset-4 hover:text-white hover:underline"
          >
            Atendimento: (83) 98691-3481
          </a>
        </nav>
        <p className="text-lg">&copy; {new Date().getFullYear()} AGTV – Todos os direitos reservados.</p>
        <p className="text-sm mt-2">
          Desenvolvido com <span role="img" aria-label="coração">❤️</span> para sua diversão.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
