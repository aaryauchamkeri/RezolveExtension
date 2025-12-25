import styles from './styles/searchresultbubble.module.css'
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function SearchResultBubble({ result }) {
    // console.log(result);
    return (
        <div className={styles.main}>
            <div className={styles.resultHeader + ' items-center'}>
                <span className='text-lg font-semibold'>{result.title}</span>
                <div className='p-2 bg-indigo-600 rounded-xl'>
                    <span className='text-xs text-white whitespace-nowrap'>{result.author.name}</span>
                </div>
            </div>
            <div className={styles.resultContent}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.text}
                </ReactMarkdown>
            </div>
        </div>
    );
};