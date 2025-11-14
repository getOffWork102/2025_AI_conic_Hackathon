import React, { Component } from "react";

class Signupwin extends Component {
  render() {
    return (
      <section>
        <form
          onSubmit={function (e) {
            e.preventDefault();
            this.props.onSubmit(e.target.nickname.value, e.target.stress.value);
            alert("Signup Successful!");
          }.bind(this)}
        >
          <p class="field">
            <label for="nickname">
              Nick Name :
              <input
                type="text"
                id="nickname"
                placeholder="Enter your nickname"
                value={this.props.nickname}
              ></input>
            </label>
          </p>
          <p class="field">
            <label for="stress">
              Stress :
              <input
                type="number"
                id="stress"
                min="0"
                max="100"
                step="5"
                placeholder="0-100"
                value={this.props.stress}
              ></input>
            </label>
          </p>
          <input
            type="submit"
            id="submit"
            value="SUBMIT"
            // onClick={function () {}.bind(this)}
          ></input>
        </form>
      </section>
    );
  }
}

export default Signupwin;
