/* eslint-disable @typescript-eslint/no-require-imports */
const {
  EXPECTED_COLOR,
  RECEIVED_COLOR,
  printDiffOrStringify,
} = require("jest-matcher-utils")
const _ = require("lodash")

const checkError = (subject, exp) => {
  if (subject instanceof Function) {
    try {
      subject()
    } catch (e) {
      subject = e
    }
  }

  if (subject.constructor !== exp.constructor) {
    return {
      message: () =>
        `Expected ${subject} to throw an instance of ${EXPECTED_COLOR(exp.name || exp.constructur.name)} but got ${RECEIVED_COLOR(subject.name || subject.constructor.name)}.`,
      pass: false,
    }
  }

  if (
    !_.isEqual({ ...subject }, { ...exp }) ||
    !_.isEqual(subject.message, exp.message)
  ) {
    return {
      message: () =>
        printDiffOrStringify(
          { ...exp, message: exp.message },
          { ...subject, message: subject.message },
          "Expected",
          "Received",
          false,
        ),
      pass: false,
    }
  }

  return {
    pass: true,
  }
}

expect.extend({
  toThrowEquals: checkError,
  toEqualError: checkError,
})
