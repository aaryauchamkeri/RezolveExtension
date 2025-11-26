import styles from './styles/messagebubble.module.css'

export default function MessageBubble({ text, user = 1 }) {
    if (user) {
        return (
            <div className={styles.main} style={{ backgroundColor: 'rgba(47, 85, 252, 1)', color: 'white' }}>{text}</div>
        )
    } else {
        return (
            <div className={styles.main}>{text}</div>
        )
    }
};