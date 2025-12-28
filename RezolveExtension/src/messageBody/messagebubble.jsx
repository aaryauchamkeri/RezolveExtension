import styles from './styles/messagebubble.module.css';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MessageBubble({ text, user = 1 }) {
    if (user) {
        return (
            <div className={styles.main} style={{ backgroundColor: 'rgba(47, 85, 252, 1)', color: 'white' }}>{text}</div>
        )
    } else {
        return (
            <div className={styles.main}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {text}
                </ReactMarkdown>
            </div>
        )
    }
};