import style from './InvalidPage.module.scss'
export default function InvalidPage({message="You don't have permission to access this page."}) {


  return (
    <div className={style.pageContainer}>
        <span>{message}</span>
    </div>
  )
}