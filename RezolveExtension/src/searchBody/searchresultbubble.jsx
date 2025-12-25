import styles from './styles/searchresultbubble.module.css'
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function SearchResultBubble({ result, aiOverview = false }) {
    // console.log(result);
    return (
        <div className={styles.main + (aiOverview ? ' border-2 border-solid border-orange-200' : '')}>
            <div className={styles.resultHeader + ' items-center' + (aiOverview ? ' justify-center' : '')}>
                <span className={(aiOverview ? 'text-2xl' : 'text-lg') + ' font-semibold'}>{result.title}</span>
                {!aiOverview ?
                    <div className='p-2 bg-indigo-600 rounded-xl'>
                        <span className='text-xs text-white whitespace-nowrap'>{result.author.name}</span>
                    </div> : null
                }
            </div>
            <div className={styles.resultContent}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.text}
                </ReactMarkdown>
            </div>
            {!aiOverview ? <div className='text-xs text-gray-500 mt-2 flex flex-row justify-end italic'>
                {'Last updated: ' + result.time_stamp.split(' ')[0]}</div> : null}
        </div>
    );
};