import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Check, ClipboardCheck, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSubnetExam, gradeSubnetExam, SUBNET_EXAM_LENGTH, type SubnetQuestion } from '@/lib/learn/subnetting';

export function SubnetExam({ onReading }: { onReading: () => void }) {
  const [questions, setQuestions] = useState<SubnetQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const question = questions[index];
  const result = finished ? gradeSubnetExam(questions, answers) : null;
  function start() { const next = createSubnetExam(); setQuestions(next); setAnswers(next.map(() => '')); setIndex(0); setFinished(false); }
  return <section className="mt-8" aria-labelledby="subnet-exam-title">
    <div className="flex items-center gap-2 text-primary"><ClipboardCheck className="size-5" /><span className="text-sm">Subnetting assessment</span></div>
    <h2 id="subnet-exam-title" className="mt-3 text-2xl font-semibold">{result ? 'Your subnetting results' : 'The scenario exam'}</h2>
    {!questions.length && <>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{SUBNET_EXAM_LENGTH} mixed questions on VLSM design, growth, boundaries, route summaries, gateway faults, wildcard masks and IPv6. Answers and explanations appear only after you finish.</p>
      <div className="mt-5 border-y py-4 text-sm leading-7"><p>No time limit · original questions · no hints during the exam</p><p className="text-muted-foreground">Use this as a closed-book check if you want a tougher challenge. Your answers last only for this visit.</p></div>
      <Button className="mt-5" onClick={start}>Start subnetting exam</Button>
    </>}
    {question && !finished && <>
      <div className="mt-5 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{question.topic}</span><span>Question {index + 1} / {questions.length} · {answers.filter(a => a.trim()).length} answered</span></div>
      <progress className="mt-2 h-1.5 w-full" max={questions.length} value={answers.filter(a => a.trim()).length} />
      <form className="mt-5 border-y py-6" onSubmit={e => { e.preventDefault(); if (index + 1 < questions.length) setIndex(index + 1); else setFinished(true); }}>
        <h3 className="text-lg font-medium leading-7">{question.prompt}</h3>
        <label className="mt-5 block text-sm">Exam answer<Input className="mt-2 font-mono" autoComplete="off" value={answers[index] ?? ''} onChange={e => { const value = e.target.value; setAnswers(prev => prev.map((a, i) => i === index ? value : a)); }} /></label>
        <div className="mt-5 flex flex-wrap justify-between gap-2"><Button type="button" variant="outline" disabled={index === 0} onClick={() => setIndex(index - 1)}>Previous</Button><Button type="submit">{index + 1 < questions.length ? 'Next question →' : 'Finish and see results'}</Button></div>
      </form>
      <nav aria-label="Exam questions" className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-10">{questions.map((q, i) => <Button key={q.prompt} size="sm" aria-label={`Go to question ${i + 1}${answers[i]?.trim() ? ', answered' : ', unanswered'}`} aria-current={i === index ? 'step' : undefined} variant={i === index ? 'default' : answers[i]?.trim() ? 'secondary' : 'outline'} onClick={() => setIndex(i)}>{i + 1}</Button>)}</nav>
      {index === questions.length - 1 && answers.some(a => !a.trim()) && <p className="mt-3 text-xs text-muted-foreground">Unanswered questions count as incorrect. You can revisit them before finishing.</p>}
    </>}
    {result && <>
      <p role="status" className="mt-4 text-3xl font-semibold">{result.correct} / {result.total} correct <span className="text-xl text-muted-foreground">· {result.percent}%</span></p>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{result.correct === result.total ? 'Excellent work on these scenarios. Keep testing your reasoning with unfamiliar address plans.' : 'Review the explanations and revisit the linked reading topics before trying again.'} This is a subnetting study score, not a Cisco passing score or a guarantee of CCNA readiness.</p>
      <div className="mt-5 flex flex-wrap gap-2"><Button onClick={start}><RotateCcw />New exam</Button><Button variant="outline" onClick={onReading}>Return to reading</Button><Button asChild variant="ghost"><Link to="/learn/test">Full networking test →</Link></Button></div>
      <h3 className="mt-8 text-xl font-semibold">Answer review</h3>
      <div className="mt-4 divide-y">{result.review.map((item, i) => <article key={item.question.prompt} className="py-5"><div className="flex items-start gap-2">{item.correct ? <Check className="mt-1 size-4 shrink-0 text-primary" /> : <X className="mt-1 size-4 shrink-0 text-destructive" />}<h4 className="text-sm font-medium leading-6">{i + 1}. {item.question.prompt}</h4></div><p className="mt-3 break-words text-sm"><span className="text-muted-foreground">Your answer: </span>{item.answer || 'Unanswered'}</p><p className="mt-1 break-words text-sm"><span className="text-muted-foreground">Correct answer: </span><strong className="font-mono font-medium">{item.question.answer}</strong></p><p className="mt-2 text-sm leading-7 text-muted-foreground">{item.question.explanation}</p><Button variant="link" size="sm" className="mt-2 h-auto whitespace-normal px-0 text-left" onClick={() => { onReading(); window.setTimeout(() => { document.getElementById(item.question.lessonId ?? '')?.scrollIntoView({ behavior: 'instant', block: 'start' }); const el = document.getElementById(item.question.lessonId ?? ''); if (el instanceof HTMLDetailsElement) el.open = true; }, 0); }}>Reread: {item.question.topic} →</Button></article>)}</div>
    </>}
  </section>;
}