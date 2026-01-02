import { useEffect, useRef, useState } from 'react';
import styles from './styles/searchresultbubble.module.css'
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MessageBubble from '../messageBody/messagebubble';

function suggestionClickHandler(e, setInput, sendQuery) {
    let qval = e.currentTarget.innerText;
    setInput(qval);
    sendQuery(qval);
}

export default function SearchResultBubble({ result, aiOverview = false, input, sendQuery, setInput }) {
    const [ind, setInd] = useState(aiOverview ? 0 : result.text.length); // typewritter animation
    const originalQuery = useRef(input);

    useEffect(() => {
        setInput("");
        console.log(originalQuery.current);
    }, []);

    if (ind < result.text.length) {
        setTimeout(() => {
            setInd(ind + 1);
        }, 10)
    }

    return (
        <div className={styles.main + (aiOverview ? ' border-2 border-solid border-orange-200' : '') + ' transition-transform duration-200 hover:-translate-y-1'}>
            <div className={styles.resultHeader + ' items-center' + (aiOverview ? ' justify-center' : '')}>
                <span className={(aiOverview ? 'text-2xl font-semibold' : 'font-semibold text-lg hover:cursor-pointer') + ' font-semibold'}>
                    {!aiOverview ? <i class="fas fa-file-word text-blue-600 rounded-full mr-2" /> : null}
                    {result.title}
                </span>
                {!aiOverview ?
                    <div className='p-2 bg-indigo-600 rounded-xl'>
                        <span className='text-xs text-white whitespace-nowrap'>{result.author.name}</span>
                    </div> : null
                }
            </div>
            <div className={styles.resultContent + ' w-full'}>
                {aiOverview ? (
                    <div className="flex flex-col items-end w-full my-3">
                        <div
                            onClick={(e) => suggestionClickHandler(e, setInput, sendQuery)}
                            className="
                                max-w-[100%] min-w-0 w-full
                                inline-flex items-center gap-2
                                rounded-tl-full rounded-tr-full rounded-bl-full
                                px-3 py-1 text-sm font-medium
                                border border-purple-200 bg-purple-50 text-purple-700
                                hover:bg-purple-100 cursor-pointer truncate
                            "
                            title={originalQuery.current}
                        >
                            <i className="fa-solid fa-magnifying-glass shrink-0" />
                            <span className="min-w-0 truncate">
                                {originalQuery.current}
                            </span>
                        </div>
                    </div>
                ) : null}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.text.slice(0, ind)}
                </ReactMarkdown>
            </div>
            {!aiOverview ? <div className='text-xs text-gray-500 mt-2 flex flex-row justify-end italic'>
                {'Last updated: ' + result.time_stamp.split(' ')[0]}</div> : null}
            {aiOverview ? <><div className='w-full flex flex-row justify-between gap-2'>
                <input type='text' className='w-full p-2 text-base text-gray-600 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    placeholder='Ask a Question: ' value={input} onChange={(e) => setInput(e.target.value)} />
                <button class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px]" disabled={input.length == 0} onClick={(e) => { sendQuery() }}><span class="fa fa-paper-plane"></span></button>
            </div>
                <div className='w-full bg-white px-2 py-4 rounded-md shadow-lg flex flex-col gap-2 border border-slate-200 border-slate-300 border-1'>
                    <span className='text-sm text-gray-500 font-medium mb-2 ml-2'>Common Followup Questions:</span>
                    <ul class="list-none p-0 m-0">
                        {result.followupQuestions.map((question) => {
                            return (
                                <li class="rounded-tl-full rounded-tr-full rounded-br-full px-3 py-1 text-sm font-medium border transition-colors duration-150 focus:outline-none bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer truncate"
                                    onClick={(e) => { suggestionClickHandler(e, setInput, sendQuery) }}
                                >
                                    <i class="fa-solid fa-magnifying-glass mr-1"></i> {question}
                                </li>
                            );
                        })}
                    </ul>
                </div>

            </> : null}
        </div>
    );
};
