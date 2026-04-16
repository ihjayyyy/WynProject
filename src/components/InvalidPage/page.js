import style from './InvalidPage.module.scss'
export default function InvalidPage() {


  return (
    <div className={style.pageContainer}>
        <span>You don't have permission to access this page.</span>
    </div>
  )
}