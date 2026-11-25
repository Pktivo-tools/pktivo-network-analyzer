import { sanitizeSuggestions } from '@/lib/learn/revisit';
const modules = [{ id: 'a', title: 'A', level: 'Beginner' }, { id: 'b', title: 'B', level: 'Beginner' }, { id: 'c', title: 'C', level: 'Advanced' }, { id: 'd', title: 'D', level: 'Advanced' }];
const m = (id: string) => ({ moduleId: id, question: 'q', chosen: 'x', correct: 'y' });
test('only suggests lessons the learner missed', () => {
  expect(sanitizeSuggestions({ lessons: [{ moduleId: 'c', reason: 'r' }, { moduleId: 'a', reason: 'r' }] }, [m('a')], modules).map(s => s.moduleId)).toEqual(['a']);
});
test('suggests at most three lessons', () => {
  const all = ['a', 'b', 'c', 'd'];
  expect(sanitizeSuggestions({ lessons: all.map(id => ({ moduleId: id, reason: 'r' })) }, all.map(m), modules)).toHaveLength(3);
});
