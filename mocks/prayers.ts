import { PrayerRequest } from '@/types/prayer';

/**
 * Example prayer requests to help users get started
 */
export const EXAMPLE_PRAYERS: Omit<PrayerRequest, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Personal
  {
    title: 'Spiritual Growth',
    description: 'Lord, help me grow closer to You each day and understand Your Word more deeply.',
    category: 'Personal',
    status: 'active',
    priority: 'high',
    reminderEnabled: false,
  },
  {
    title: 'Wisdom in Decisions',
    description: 'Father, grant me wisdom and discernment in the decisions I face today.',
    category: 'Personal',
    status: 'active',
    priority: 'medium',
    reminderEnabled: false,
  },
  {
    title: 'Overcoming Temptation',
    description: 'Give me strength to resist temptation and walk in Your ways.',
    category: 'Personal',
    status: 'active',
    priority: 'medium',
    reminderEnabled: false,
  },

  // Family
  {
    title: 'Family Unity',
    description: 'Lord, bless my family with love, peace, and unity. Help us to support and encourage one another.',
    category: 'Family',
    status: 'active',
    priority: 'high',
    reminderEnabled: false,
  },
  {
    title: 'Children\'s Faith',
    description: 'I pray for my children to grow in faith and know You personally.',
    category: 'Family',
    status: 'active',
    priority: 'high',
    reminderEnabled: false,
  },
  {
    title: 'Marriage Blessing',
    description: 'Strengthen our marriage and help us honor You in our relationship.',
    category: 'Family',
    status: 'active',
    priority: 'medium',
    reminderEnabled: false,
  },

  // Friends
  {
    title: 'Salvation of Friends',
    description: 'I pray for my friends who don\'t know You yet. Open their hearts to Your love.',
    category: 'Friends',
    status: 'active',
    priority: 'high',
    reminderEnabled: false,
  },
  {
    title: 'Encouragement for Friends',
    description: 'Help me be a light and encouragement to my friends in their struggles.',
    category: 'Friends',
    status: 'active',
    priority: 'medium',
    reminderEnabled: false,
  },

  // Health
  {
    title: 'Physical Healing',
    description: 'Lord, I ask for Your healing touch on my body. Restore my health and strength.',
    category: 'Health',
    status: 'active',
    priority: 'high',
    reminderEnabled: false,
  },
  {
    title: 'Mental Peace',
    description: 'Grant me peace of mind and freedom from anxiety. Help me trust in You.',
    category: 'Health',
    status: 'active',
    priority: 'medium',
    reminderEnabled: false,
  },
  {
    title: 'Energy and Rest',
    description: 'Give me the energy I need for today and restful sleep at night.',
    category: 'Health',
    status: 'active',
    priority: 'low',
    reminderEnabled: false,
  },

  // Guidance
  {
    title: 'Career Direction',
    description: 'Show me Your will for my career and open doors according to Your purpose.',
    category: 'Guidance',
    status: 'active',
    priority: 'high',
    reminderEnabled: false,
  },
  {
    title: 'Life Purpose',
    description: 'Reveal to me Your purpose for my life and help me walk in it.',
    category: 'Guidance',
    status: 'active',
    priority: 'high',
    reminderEnabled: false,
  },
  {
    title: 'Daily Direction',
    description: 'Order my steps today and help me make choices that honor You.',
    category: 'Guidance',
    status: 'active',
    priority: 'medium',
    reminderEnabled: false,
  },

  // Thanksgiving
  {
    title: 'Daily Provision',
    description: 'Thank You for providing for all my needs and blessing me abundantly.',
    category: 'Thanksgiving',
    status: 'active',
    priority: 'medium',
    reminderEnabled: false,
  },
  {
    title: 'Salvation',
    description: 'I praise You for the gift of salvation through Jesus Christ.',
    category: 'Thanksgiving',
    status: 'active',
    priority: 'high',
    reminderEnabled: false,
  },
  {
    title: 'Answered Prayers',
    description: 'Thank You for the prayers You have answered and Your faithfulness.',
    category: 'Thanksgiving',
    status: 'active',
    priority: 'medium',
    reminderEnabled: false,
  },

  // Church
  {
    title: 'Church Leadership',
    description: 'Bless our pastors and church leaders with wisdom, strength, and vision.',
    category: 'Church',
    status: 'active',
    priority: 'high',
    reminderEnabled: false,
  },
  {
    title: 'Church Unity',
    description: 'Unite our church body in love and purpose. Help us serve You together.',
    category: 'Church',
    status: 'active',
    priority: 'medium',
    reminderEnabled: false,
  },
  {
    title: 'Church Growth',
    description: 'Draw people to our church and help us reach our community with the gospel.',
    category: 'Church',
    status: 'active',
    priority: 'medium',
    reminderEnabled: false,
  },

  // World
  {
    title: 'World Peace',
    description: 'Bring peace to nations in conflict and end violence and war.',
    category: 'World',
    status: 'active',
    priority: 'high',
    reminderEnabled: false,
  },
  {
    title: 'Missionaries',
    description: 'Protect and empower missionaries around the world sharing the gospel.',
    category: 'World',
    status: 'active',
    priority: 'high',
    reminderEnabled: false,
  },
  {
    title: 'Persecuted Church',
    description: 'Strengthen believers facing persecution and give them courage and hope.',
    category: 'World',
    status: 'active',
    priority: 'high',
    reminderEnabled: false,
  },
  {
    title: 'Global Revival',
    description: 'Send revival and spiritual awakening across the nations.',
    category: 'World',
    status: 'active',
    priority: 'medium',
    reminderEnabled: false,
  },
];

