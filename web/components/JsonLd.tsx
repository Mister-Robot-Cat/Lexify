export default function JsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Lexify',
    url: 'https://lexify.app',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Telegram, Web, Android, iOS',
    featureList: [
      'AI vocabulary explanations',
      'IELTS writing evaluation',
      'Spaced repetition quizzes',
      'Grammar chatbot',
    ],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'AI-powered language learning assistant in Telegram and Web. Master vocabulary with AI explanations, spaced repetition, and IELTS writing evaluation.',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '128',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
