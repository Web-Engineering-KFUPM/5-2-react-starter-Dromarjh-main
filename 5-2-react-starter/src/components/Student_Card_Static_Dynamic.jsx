function StudentCardDynamic(props) {
  return (
    <div>
      <h3>Name: {props.name}</h3>
      <p>ID: {props.id}</p>
      <p>Department: {props.department}</p>
    </div>
  );
}

export default StudentCardDynamic;
