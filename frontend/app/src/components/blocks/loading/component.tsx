import "./component.css"

const LoadingScreen = () => {
    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-background z-999999 flex items-center justify-center">
            <div className="loader" />
        </div>
    )
}

export default LoadingScreen