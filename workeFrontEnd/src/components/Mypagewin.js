import React, { Component } from "react";

class Mypagewin extends Component {
  render() {
    return (
      <div>
        <section>
          <form
            onSubmit={function (e) {
              e.preventDefault();
              this.props.onSubmit(
                e.target.nickname.value,
                e.target.stress.value
              );
              alert("APPLY Successful!");
            }.bind(this)}
          >
            <p class="field">
              <label for="nickname">
                Nick Name :
                <input
                  type="text"
                  id="nickname"
                  defaultValue={this.props.nickname}
                ></input>
              </label>
            </p>
            <p class="field" id="stressfield">
              <label for="stress">
                Stress :
                <input
                  type="number"
                  id="stress"
                  defaultValue={this.props.stress}
                  min="0"
                  max="100"
                  step="5"
                ></input>
              </label>
            </p>
            <div class="field" id="emailfield">
              <label for="email">
                Email :
                <input
                  type="text"
                  id="email"
                  value={this.props.email}
                  readOnly
                ></input>
              </label>
            </div>

            <input
              type="submit"
              id="apply"
              value="APPLY"
              class="button"
              // onClick={function () {}.bind(this)}
            ></input>
          </form>
        </section>
        <div id="buttons">
          <input
            type="submit"
            id="logout"
            value="LOG OUT"
            class="button"
            onClick={function (e) {
              e.preventDefault();
              this.props.onLogout();
              alert("Logged Out!");
            }.bind(this)}
          ></input>
          <input
            type="submit"
            id="delete"
            value="DELETE ACCOUNT"
            class="button"
            onClick={function (e) {
              e.preventDefault();
              this.props.onDelete();
              alert("Account Deleted!");
            }.bind(this)}
          ></input>
        </div>
      </div>
    );
  }
}

export default Mypagewin;
