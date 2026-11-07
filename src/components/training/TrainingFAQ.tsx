import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: "How do I enroll in a training program?",
    answer: "You can enroll by clicking the 'Enroll Now' button on any course card. Fill out the short registration form, and our team will contact you within 24 hours with the next steps and payment instructions."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept mobile banking (bKash, Nagad), bank transfers, and all major credit/debit cards. Detailed payment instructions will be provided via email after you register your interest."
  },
  {
    question: "When do I get access to the course materials?",
    answer: "Once your enrollment is confirmed and payment is processed, you will receive an email with your login credentials and immediate access to the course portal and all introductory materials."
  },
  {
    question: "Are there any prerequisites?",
    answer: "Prerequisites vary by course. For example, our VAT Training requires a basic understanding of tax or a background in accounting/law, while our MS Office and Practical Accounting tracks are suitable for beginners."
  },
  {
    question: "Will I receive a certificate upon completion?",
    answer: "Yes! All our training programs (except preparatory courses like Bar Council/High Court Prep) provide a verifiable certificate of completion that you can add to your resume and LinkedIn profile."
  },
  {
    question: "Can I access the training modules on my mobile device?",
    answer: "Absolutely. Our learning platform is fully responsive, meaning you can watch video lectures, read materials, and complete quizzes on your smartphone, tablet, or computer."
  }
];

export function TrainingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
        <p className="text-slate-600 text-lg">Got questions? We've got answers.</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className={`border rounded-2xl overflow-hidden transition-colors ${openIndex === index ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
            >
              <span className="font-semibold text-slate-900">{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-emerald-600 shrink-0 ml-4" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 ml-4" />
              )}
            </button>
            
            {openIndex === index && (
              <div className="px-6 pb-5 text-slate-600 leading-relaxed animate-in slide-in-from-top-2 duration-200">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
