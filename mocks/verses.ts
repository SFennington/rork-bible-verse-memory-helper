import { BibleVerse } from '@/types/verse';

export const BIBLE_VERSES: BibleVerse[] = [
  {
    id: '1',
    reference: 'Philippians 4:13',
    text: 'I can do all things through Christ who strengthens me',
    category: 'Strength',
  },
  {
    id: '2',
    reference: 'Jeremiah 29:11',
    text: 'For I know the plans I have for you declares the Lord plans to prosper you and not to harm you plans to give you hope and a future',
    category: 'Hope',
  },
  {
    id: '3',
    reference: 'Psalm 23:1',
    text: 'The Lord is my shepherd I shall not want',
    category: 'Comfort',
  },
  {
    id: '4',
    reference: 'Proverbs 3:5-6',
    text: 'Trust in the Lord with all your heart and lean not on your own understanding in all your ways acknowledge Him and He will make your paths straight',
    category: 'Faith',
  },
  {
    id: '5',
    reference: 'John 3:16',
    text: 'For God so loved the world that He gave His one and only Son that whoever believes in Him shall not perish but have eternal life',
    category: 'Love',
  },
  {
    id: '6',
    reference: 'Isaiah 41:10',
    text: 'So do not fear for I am with you do not be dismayed for I am your God I will strengthen you and help you I will uphold you with my righteous right hand',
    category: 'Strength',
  },
  {
    id: '7',
    reference: 'Romans 8:28',
    text: 'And we know that in all things God works for the good of those who love Him who have been called according to His purpose',
    category: 'Hope',
  },
  {
    id: '8',
    reference: 'Psalm 46:1',
    text: 'God is our refuge and strength an ever present help in trouble',
    category: 'Comfort',
  },
  {
    id: '9',
    reference: 'Matthew 11:28',
    text: 'Come to me all you who are weary and burdened and I will give you rest',
    category: 'Peace',
  },
  {
    id: '10',
    reference: '1 Corinthians 13:4-5',
    text: 'Love is patient love is kind it does not envy it does not boast it is not proud it does not dishonor others it is not self seeking it is not easily angered it keeps no record of wrongs',
    category: 'Love',
  },
  {
    id: '11',
    reference: 'Joshua 1:9',
    text: 'Have I not commanded you be strong and courageous do not be afraid do not be discouraged for the Lord your God will be with you wherever you go',
    category: 'Strength',
  },
  {
    id: '12',
    reference: 'Hebrews 11:1',
    text: 'Now faith is confidence in what we hope for and assurance about what we do not see',
    category: 'Faith',
  },
  {
    id: '13',
    reference: 'Philippians 4:6-7',
    text: 'Do not be anxious about anything but in every situation by prayer and petition with thanksgiving present your requests to God and the peace of God which transcends all understanding will guard your hearts and your minds in Christ Jesus',
    category: 'Peace',
  },
  {
    id: '14',
    reference: 'Romans 15:13',
    text: 'May the God of hope fill you with all joy and peace as you trust in Him so that you may overflow with hope by the power of the Holy Spirit',
    category: 'Hope',
  },
  {
    id: '15',
    reference: 'Psalm 46:10',
    text: 'Be still and know that I am God',
    category: 'Peace',
  },
];

export const CATEGORIES: { name: string; color: string; gradient: [string, string] }[] = [
  { name: 'Comfort', color: '#8B7FD6', gradient: ['#8B7FD6', '#A89FE8'] },
  { name: 'Strength', color: '#E67E50', gradient: ['#E67E50', '#F29A73'] },
  { name: 'Peace', color: '#5BA3D0', gradient: ['#5BA3D0', '#7BB8DD'] },
  { name: 'Love', color: '#E85D75', gradient: ['#E85D75', '#F27D93'] },
  { name: 'Faith', color: '#6BBF73', gradient: ['#6BBF73', '#88D18F'] },
  { name: 'Hope', color: '#F4A261', gradient: ['#F4A261', '#F7B77F'] },
];
