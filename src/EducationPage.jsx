import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Heart, BookOpen, ArrowRight, X } from "lucide-react";
import { Card } from "./components/ui/Card";
import { Button } from "./components/ui/Button";

const EducationPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);

  const educationTopics = [
    {
      id: 1,
      title: "Menstrual Cycle Basics",
      description: "Learn about the phases of your menstrual cycle, what's normal, and how to track it effectively.",
      icon: "📅",
      category: "Basics"
    },
    {
      id: 2,
      title: "Period Pain Relief",
      description: "Natural and medical remedies to manage cramps, bloating, and discomfort during your period.",
      icon: "💊",
      category: "Health"
    },
    {
      id: 3,
      title: "Nutrition & Hormones",
      description: "Discover how food affects your hormones and cycle, and what to eat for better menstrual health.",
      icon: "🥗",
      category: "Nutrition"
    },
    {
      id: 4,
      title: "Mental Health & Periods",
      description: "Understanding the connection between your cycle and mental wellbeing, including PMS and PMDD.",
      icon: "🧘",
      category: "Mental Health"
    },
    {
      id: 5,
      title: "Hygiene & Self-Care",
      description: "Best practices for menstrual hygiene, product options, and self-care during your period.",
      icon: "🌸",
      category: "Self-Care"
    },
    {
      id: 6,
      title: "Irregular Periods",
      description: "Understanding what causes irregular cycles, when to seek help, and how to manage them.",
      icon: "📊",
      category: "Health"
    },
    {
      id: 7,
      title: "Fertility Awareness",
      description: "Learn about your fertile window, ovulation signs, and natural family planning methods.",
      icon: "🌺",
      category: "Fertility"
    },
    {
      id: 8,
      title: "Teen Menstrual Health",
      description: "A guide for young people starting their period journey, with age-appropriate information.",
      icon: "👧",
      category: "Basics"
    },
    {
      id: 9,
      title: "Menopause & Perimenopause",
      description: "Understanding the transition, symptoms, and how to manage this natural life stage.",
      icon: "🌙",
      category: "Health"
    },
    {
      id: 10,
      title: "Exercise & Your Cycle",
      description: "How to adapt your workout routine to your cycle phases for optimal health and performance.",
      icon: "🏃",
      category: "Fitness"
    },
    {
      id: 11,
      title: "Sleep & Menstrual Health",
      description: "How your cycle affects sleep and strategies for better rest during different phases.",
      icon: "😴",
      category: "Wellness"
    },
    {
      id: 12,
      title: "Cultural Perspectives",
      description: "Exploring menstrual health across different cultures and breaking taboos together.",
      icon: "🌍",
      category: "Culture"
    }
  ];

  const filteredTopics = educationTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Content for topics that have detailed information
  const topicContent = {
    1: {
      title: "Menstrual Cycle Basics",
      sections: [
        {
          heading: "Understanding Your Menstrual Cycle",
          content: `Your menstrual cycle is a natural process that prepares your body for potential pregnancy each month. The cycle is controlled by hormones and typically lasts between 21 to 35 days, with the average being 28 days. Understanding your cycle helps you track your health and recognize when something might be off.`
        },
        {
          heading: "The Four Phases of Your Cycle",
          content: `Your menstrual cycle consists of four distinct phases:

1. **Menstrual Phase (Days 1-5)**: This is when you have your period. The lining of your uterus (endometrium) is shed, resulting in menstrual bleeding. This phase typically lasts 3-7 days.

2. **Follicular Phase (Days 1-13)**: This phase overlaps with menstruation and continues until ovulation. Your pituitary gland releases follicle-stimulating hormone (FSH), which stimulates your ovaries to produce follicles. One follicle will mature into an egg.

3. **Ovulation (Day 14)**: Around the middle of your cycle, a surge in luteinizing hormone (LH) triggers the release of a mature egg from your ovary. This is your most fertile time, and the egg can survive for 12-24 hours.

4. **Luteal Phase (Days 15-28)**: After ovulation, the empty follicle becomes the corpus luteum, which produces progesterone. This hormone prepares your uterus for a potential pregnancy. If pregnancy doesn't occur, hormone levels drop, and your next period begins.`
        },
        {
          heading: "What's Normal?",
          content: `Every person's cycle is unique, but here are some general guidelines for what's considered normal:

- **Cycle Length**: 21-35 days (variations of a few days are normal)
- **Period Duration**: 3-7 days
- **Bleeding Amount**: Typically 30-80ml (about 2-6 tablespoons) over the entire period
- **Color Variations**: Blood can range from bright red to dark brown, and this is normal
- **Clots**: Small clots (smaller than a quarter) are usually normal

Remember: What's normal for you might be different from someone else. The key is understanding your own pattern.`
        },
        {
          heading: "Tracking Your Cycle",
          content: `Tracking your cycle has many benefits:

- **Predict Your Period**: Know when to expect your next period
- **Identify Patterns**: Notice symptoms, mood changes, or irregularities
- **Fertility Awareness**: Understand your fertile window if you're trying to conceive or avoid pregnancy
- **Health Monitoring**: Detect changes that might indicate health issues

You can track your cycle by:
- Marking the first day of your period on a calendar
- Using period tracking apps
- Noting symptoms, mood, and flow intensity
- Tracking basal body temperature and cervical mucus (for fertility awareness)`
        },
        {
          heading: "When to See a Healthcare Provider",
          content: `While variations are normal, you should consult a healthcare provider if you experience:

- Periods that are consistently less than 21 days or more than 35 days apart
- Bleeding that lasts longer than 7 days
- Very heavy bleeding (soaking through a pad or tampon every 1-2 hours)
- Severe pain that interferes with daily activities
- Missing periods for 3+ months (if not pregnant, menopausal, or on birth control)
- Bleeding between periods
- Sudden changes in your cycle pattern

Remember: Your menstrual health is an important part of your overall wellbeing. Don't hesitate to seek professional advice if something doesn't feel right.`
        }
      ]
    },
    2: {
      title: "Period Pain Relief",
      sections: [
        {
          heading: "Understanding Period Pain",
          content: `Period pain, also known as dysmenorrhea, is very common. About 80% of people who menstruate experience some level of discomfort during their periods. The pain is caused by prostaglandins, hormone-like substances that make your uterus contract to shed its lining. These contractions can cause cramping, and in some cases, the pain can be quite severe.`
        },
        {
          heading: "Natural Remedies",
          content: `Many people find relief through natural methods:

**Heat Therapy**
- Apply a heating pad or hot water bottle to your lower abdomen
- Take a warm bath or shower
- Use heat patches that stick to your clothing

**Exercise & Movement**
- Light exercise like walking, yoga, or stretching can help
- Gentle yoga poses like child's pose or cat-cow can relieve tension
- Regular exercise throughout the month may reduce period pain over time

**Dietary Changes**
- Stay hydrated with plenty of water
- Reduce salt intake to minimize bloating
- Eat anti-inflammatory foods like ginger, turmeric, and leafy greens
- Some people find relief by reducing caffeine and alcohol
- Consider foods rich in magnesium (nuts, seeds, dark chocolate)

**Herbal Remedies**
- Ginger tea may help reduce inflammation and pain
- Chamomile tea can have calming and anti-inflammatory effects
- Cinnamon has been shown to help with menstrual cramps
- Always consult with a healthcare provider before trying herbal supplements`
        },
        {
          heading: "Medical Treatments",
          content: `If natural remedies aren't enough, medical options are available:

**Over-the-Counter Medications**
- **NSAIDs** (Non-Steroidal Anti-Inflammatory Drugs) like ibuprofen or naproxen are often the first line of defense
- These work by reducing prostaglandin production
- Take them at the first sign of cramps for best results
- Always follow the recommended dosage on the package

**Prescription Options**
- If OTC medications don't help, your healthcare provider may prescribe stronger pain relievers
- Hormonal birth control (pills, patches, IUDs) can reduce or eliminate period pain for many people
- These work by thinning the uterine lining, which means less prostaglandin production

**When to Seek Medical Help**
- Pain that's severe and doesn't respond to OTC medications
- Pain that interferes with daily activities or sleep
- Pain that's getting worse over time
- Pain accompanied by heavy bleeding, fever, or other concerning symptoms`
        },
        {
          heading: "Additional Comfort Measures",
          content: `Beyond medications, these strategies can help you feel more comfortable:

**Rest & Relaxation**
- Get plenty of sleep
- Practice relaxation techniques like deep breathing or meditation
- Take time to rest when you need it

**Massage & Acupressure**
- Gentle abdominal massage can help relieve tension
- Acupressure points on the lower back and abdomen may provide relief
- Consider professional massage therapy

**Comfortable Clothing**
- Wear loose, comfortable clothing
- Avoid tight waistbands that can put pressure on your abdomen

**Mental Health Support**
- Period pain can be emotionally draining
- Talk to friends, family, or a counselor if you're struggling
- Remember that your pain is valid and seeking help is important`
        },
        {
          heading: "Prevention Strategies",
          content: `While you can't always prevent period pain, these strategies may help reduce its severity:

- **Regular Exercise**: Maintaining an active lifestyle throughout the month can reduce period pain
- **Healthy Diet**: A balanced diet with plenty of fruits, vegetables, and whole grains supports overall health
- **Stress Management**: High stress levels can worsen period symptoms, so finding healthy ways to manage stress is important
- **Adequate Sleep**: Getting 7-9 hours of sleep regularly helps your body function optimally
- **Stay Hydrated**: Drinking enough water throughout the month can help reduce bloating and discomfort

Remember: Severe period pain is not something you have to "just deal with." If your pain is significantly impacting your life, talk to a healthcare provider. There are many effective treatment options available.`
        }
      ]
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-pink-50/40 via-purple-50/30 to-pink-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 sm:px-6 py-8 relative overflow-hidden">
      {/* Background Elements */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 120, ease: "linear" }}
        className="absolute top-10 left-10 w-80 h-80 bg-rose-200/20 dark:bg-rose-900/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 140, ease: "linear" }}
        className="absolute bottom-10 right-10 w-96 h-96 bg-violet-200/20 dark:bg-violet-900/20 rounded-full blur-3xl"
      />

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <BookOpen className="w-8 h-8 text-rose-400" />
            <h1 className="text-4xl sm:text-5xl font-semibold text-gray-800 dark:text-gray-100">
              Education Hub
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Empowering you with evidence-based information about menstrual health, wellness, and self-care
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search topics, symptoms, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-800/90 backdrop-blur-lg border border-pink-200/50 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-lg"
            />
          </div>
        </motion.div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Card className="dark:bg-gray-800/90 dark:border-gray-700 h-full flex flex-col hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl flex-shrink-0">{topic.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {topic.title}
                      </h3>
                    </div>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-full">
                      {topic.category}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4 flex-1 leading-relaxed">
                  {topic.description}
                </p>
                <Button
                  variant="ghost"
                  className="w-full justify-between group/btn"
                  onClick={() => {
                    if (topicContent[topic.id]) {
                      setSelectedTopic(topic.id);
                    } else {
                      alert(`Content for "${topic.title}" is coming soon! 💕`);
                    }
                  }}
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* No Results Message */}
        {filteredTopics.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No topics found matching "{searchQuery}"
            </p>
            <Button
              variant="secondary"
              onClick={() => setSearchQuery("")}
              className="mt-4"
            >
              Clear Search
            </Button>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-6"
        >
          <Heart className="w-6 h-6 text-rose-400 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400 italic">
            "Knowledge is power. Understanding your body is the first step to taking care of it." 💕
          </p>
        </motion.div>
      </div>

      {/* Topic Detail Modal */}
      <AnimatePresence>
        {selectedTopic && topicContent[selectedTopic] && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTopic(null)}
              className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {educationTopics.find(t => t.id === selectedTopic)?.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                        {topicContent[selectedTopic].title}
                      </h2>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {educationTopics.find(t => t.id === selectedTopic)?.category}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {topicContent[selectedTopic].sections.map((section, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-br from-rose-50/50 to-pink-50/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl p-6 border border-rose-200/30 dark:border-gray-600"
                    >
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-rose-400" />
                        {section.heading}
                      </h3>
                      <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {section.content.split('\n').map((paragraph, pIndex) => {
                          // Check if paragraph contains bold text (text between **)
                          const parts = paragraph.split(/(\*\*.*?\*\*)/g);
                          return (
                            <p key={pIndex} className="mb-3 last:mb-0">
                              {parts.map((part, partIndex) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  return (
                                    <strong key={partIndex} className="text-gray-900 dark:text-gray-100 font-semibold">
                                      {part.slice(2, -2)}
                                    </strong>
                                  );
                                }
                                return <span key={partIndex}>{part}</span>;
                              })}
                            </p>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                  <Button
                    variant="primary"
                    onClick={() => setSelectedTopic(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EducationPage;

